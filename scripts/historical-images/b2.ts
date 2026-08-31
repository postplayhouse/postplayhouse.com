import { STORE_PREFIX } from "./config"
import type { ArtifactStore } from "./store"

interface B2Auth {
	authorizationToken: string
	apiUrl: string
	downloadUrl: string
	allowed: {
		bucketId: string | null
		capabilities: string[]
		namePrefix: string | null
	}
}

interface Credentials {
	keyId: string
	applicationKey: string
	bucketId: string
}

const requestTimeout = 30_000
const objectTimeout = 5 * 60_000
const retryDelays = [250, 500, 1_000, 2_000, 4_000]

function encodeName(name: string): string {
	return name.split("/").map(encodeURIComponent).join("/")
}

function assertArtifactName(name: string): void {
	if (!name.startsWith(`${STORE_PREFIX}/`))
		throw new Error(`B2 artifact name is outside ${STORE_PREFIX}/: ${name}`)
}

async function failure(response: Response): Promise<string> {
	const detail = (await response.text()).replace(/\s+/g, " ").trim()
	return detail
		? `${response.status}: ${detail.slice(0, 500)}`
		: String(response.status)
}

function retryable(response: Response): boolean {
	return response.status === 429 || response.status >= 500
}

async function request(
	input: string,
	init: RequestInit,
	delays = retryDelays,
): Promise<Response> {
	for (const delay of delays) {
		const response = await fetch(input, init)
		if (!retryable(response)) return response
		await response.arrayBuffer()
		await new Promise((resolve) => setTimeout(resolve, delay))
	}
	return fetch(input, init)
}

export class B2ArtifactStore implements ArtifactStore {
	private authPromise?: Promise<B2Auth>

	constructor(private readonly credentials: Credentials) {}

	private authorize(): Promise<B2Auth> {
		return (this.authPromise ??= (async () => {
			const authorization = Buffer.from(
				`${this.credentials.keyId}:${this.credentials.applicationKey}`,
			).toString("base64")
			const response = await request(
				"https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
				{
					headers: { Authorization: `Basic ${authorization}` },
					signal: AbortSignal.timeout(requestTimeout),
				},
			)
			if (!response.ok)
				throw new Error(`B2 authorization failed (${await failure(response)})`)
			const auth = (await response.json()) as B2Auth
			if (
				auth.allowed.bucketId !== null &&
				auth.allowed.bucketId !== this.credentials.bucketId
			)
				throw new Error("B2 key is not authorized for the configured bucket")
			return auth
		})())
	}

	private async requireCapabilities(
		...capabilities: string[]
	): Promise<B2Auth> {
		const auth = await this.authorize()
		const missing = capabilities.filter(
			(capability) => !auth.allowed.capabilities.includes(capability),
		)
		if (missing.length > 0)
			throw new Error(
				`B2 key lacks required capabilities: ${missing.join(", ")}`,
			)
		const prefix = auth.allowed.namePrefix
		if (prefix && !"historical-images/v1/".startsWith(prefix))
			throw new Error(
				`B2 key name prefix does not permit historical-images/v1/: ${prefix}`,
			)
		return auth
	}

	async checkPermissions(write: boolean): Promise<void> {
		await this.requireCapabilities(
			"listFiles",
			"readFiles",
			...(write ? ["writeFiles"] : []),
		)
	}

	async get(name: string): Promise<Buffer | null> {
		assertArtifactName(name)
		const auth = await this.requireCapabilities("listFiles", "readFiles")
		const list = await request(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
			method: "POST",
			headers: {
				Authorization: auth.authorizationToken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				bucketId: this.credentials.bucketId,
				startFileName: name,
				maxFileCount: 1,
			}),
			signal: AbortSignal.timeout(requestTimeout),
		})
		if (!list.ok)
			throw new Error(`B2 file lookup failed (${await failure(list)})`)
		const files = (await list.json()) as {
			files: Array<{ fileId: string; fileName: string }>
		}
		const file = files.files[0]
		if (!file || file.fileName !== name) return null
		const response = await request(
			`${auth.downloadUrl}/b2api/v2/b2_download_file_by_id?fileId=${encodeURIComponent(file.fileId)}`,
			{
				headers: { Authorization: auth.authorizationToken },
				signal: AbortSignal.timeout(objectTimeout),
			},
		)
		if (!response.ok)
			throw new Error(`B2 download failed (${await failure(response)})`)
		return Buffer.from(await response.arrayBuffer())
	}

	private async upload(
		name: string,
		body: Buffer,
		contentType: string,
	): Promise<void> {
		assertArtifactName(name)
		const auth = await this.requireCapabilities("writeFiles")
		const urlResponse = await request(
			`${auth.apiUrl}/b2api/v2/b2_get_upload_url`,
			{
				method: "POST",
				headers: {
					Authorization: auth.authorizationToken,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ bucketId: this.credentials.bucketId }),
				signal: AbortSignal.timeout(requestTimeout),
			},
		)
		if (!urlResponse.ok)
			throw new Error(
				`B2 upload URL request failed (${await failure(urlResponse)})`,
			)
		const target = (await urlResponse.json()) as {
			uploadUrl: string
			authorizationToken: string
		}
		const sha1 = (await import("node:crypto"))
			.createHash("sha1")
			.update(body)
			.digest("hex")
		const response = await request(target.uploadUrl, {
			method: "POST",
			headers: {
				Authorization: target.authorizationToken,
				"X-Bz-File-Name": encodeName(name),
				"X-Bz-Content-Sha1": sha1,
				"Content-Type": contentType,
				"Content-Length": String(body.length),
			},
			body: Uint8Array.from(body),
			signal: AbortSignal.timeout(objectTimeout),
		})
		if (!response.ok)
			throw new Error(`B2 upload failed (${await failure(response)})`)
	}

	async putImmutable(
		name: string,
		body: Buffer,
		contentType: string,
	): Promise<"created" | "exists"> {
		const existing = await this.get(name)
		if (existing) {
			if (!existing.equals(body))
				throw new Error(`Immutable artifact collision at ${name}`)
			return "exists"
		}
		await this.upload(name, body, contentType)
		return "created"
	}

	async putPointer(name: string, body: Buffer): Promise<void> {
		await this.upload(name, body, "application/json")
	}
}
