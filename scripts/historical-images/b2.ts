import { createHash } from "node:crypto"
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
	storePrefix: string
}

interface B2File {
	fileId: string
	fileName: string
	contentLength?: number
	contentSha1?: string
}

const requestTimeout = 30_000
const objectTimeout = 5 * 60_000
const retryDelays = [250, 500, 1_000, 2_000, 4_000]

function encodeName(name: string): string {
	return name.split("/").map(encodeURIComponent).join("/")
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

function retryableError(error: unknown): boolean {
	return (
		error instanceof TypeError ||
		(error instanceof Error &&
			(error.name === "AbortError" || error.name === "TimeoutError"))
	)
}

function retryAfter(response: Response): number | undefined {
	const value = response.headers.get("Retry-After")
	if (!value) return
	const seconds = Number(value)
	if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
	const date = Date.parse(value)
	if (Number.isFinite(date)) return Math.max(0, date - Date.now())
}

class B2AuthorizationExpired extends Error {}

async function request(
	input: string,
	init: RequestInit,
	delays = retryDelays,
	timeout = requestTimeout,
): Promise<Response> {
	for (let attempt = 0; ; attempt += 1) {
		try {
			const response = await fetch(input, {
				...init,
				signal: AbortSignal.timeout(timeout),
			})
			if (!retryable(response) || attempt === delays.length) return response
			await response.arrayBuffer()
			const instructed = retryAfter(response)
			const delay = Math.min(
				30_000,
				instructed === undefined
					? delays[attempt] * (0.75 + Math.random() * 0.5)
					: instructed + Math.random() * Math.min(1_000, instructed * 0.25),
			)
			await new Promise((resolve) => setTimeout(resolve, delay))
		} catch (error) {
			if (!retryableError(error) || attempt === delays.length) throw error
			const delay = delays[attempt] * (0.75 + Math.random() * 0.5)
			await new Promise((resolve) => setTimeout(resolve, delay))
		}
	}
}

export class B2ArtifactStore implements ArtifactStore {
	private authPromise?: Promise<B2Auth>
	private inventory?: Map<string, B2File>
	private inventoriedNames?: Set<string>

	constructor(private readonly credentials: Credentials) {}

	private async withReauthorization<T>(
		operation: () => Promise<T>,
	): Promise<T> {
		try {
			return await operation()
		} catch (error) {
			if (!(error instanceof B2AuthorizationExpired)) throw error
			this.authPromise = undefined
			this.inventory = undefined
			this.inventoriedNames = undefined
			return operation()
		}
	}

	private assertArtifactName(name: string): void {
		if (!name.startsWith(`${this.credentials.storePrefix}/`))
			throw new Error(
				`B2 artifact name is outside ${this.credentials.storePrefix}/: ${name}`,
			)
	}

	private authorize(): Promise<B2Auth> {
		return (this.authPromise ??= (async () => {
			const authorization = Buffer.from(
				`${this.credentials.keyId}:${this.credentials.applicationKey}`,
			).toString("base64")
			const response = await request(
				"https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
				{
					headers: { Authorization: `Basic ${authorization}` },
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
		const storePrefix = `${this.credentials.storePrefix}/`
		if (prefix && !storePrefix.startsWith(prefix))
			throw new Error(
				`B2 key name prefix does not permit ${storePrefix}: ${prefix}`,
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
		return this.withReauthorization(() => this.getOnce(name))
	}

	private async getOnce(name: string): Promise<Buffer | null> {
		this.assertArtifactName(name)
		const auth = await this.requireCapabilities("listFiles", "readFiles")
		let fileId = this.inventory?.get(name)?.fileId
		if (!this.inventory || !this.inventoriedNames?.has(name)) {
			const list = await this.list(auth, name, 1)
			const file = list.files[0]
			if (!file || file.fileName !== name) return null
			fileId = file.fileId
		}
		if (!fileId) return null
		const response = await request(
			`${auth.downloadUrl}/b2api/v2/b2_download_file_by_id?fileId=${encodeURIComponent(fileId)}`,
			{
				headers: { Authorization: auth.authorizationToken },
			},
			retryDelays,
			objectTimeout,
		)
		if (response.status === 401) throw new B2AuthorizationExpired()
		if (!response.ok)
			throw new Error(`B2 download failed (${await failure(response)})`)
		return Buffer.from(await response.arrayBuffer())
	}

	private async list(
		auth: B2Auth,
		startFileName: string,
		maxFileCount: number,
	) {
		const response = await request(
			`${auth.apiUrl}/b2api/v2/b2_list_file_names`,
			{
				method: "POST",
				headers: {
					Authorization: auth.authorizationToken,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bucketId: this.credentials.bucketId,
					startFileName,
					maxFileCount,
				}),
			},
		)
		if (response.status === 401) throw new B2AuthorizationExpired()
		if (!response.ok)
			throw new Error(`B2 file lookup failed (${await failure(response)})`)
		return (await response.json()) as {
			files: B2File[]
			nextFileName?: string | null
		}
	}

	async prime(names: string[]): Promise<void> {
		await this.withReauthorization(() => this.primeOnce(names))
	}

	private async primeOnce(names: string[]): Promise<void> {
		for (const name of names) this.assertArtifactName(name)
		const wanted = new Set(names)
		const inventory = new Map<string, B2File>()
		if (wanted.size === 0) {
			this.inventory = inventory
			this.inventoriedNames = wanted
			return
		}
		const auth = await this.requireCapabilities("listFiles", "readFiles")
		let start = [...wanted].sort()[0]
		const end = [...wanted].sort().at(-1)!
		while (start <= end) {
			const page = await this.list(auth, start, 1_000)
			for (const file of page.files)
				if (wanted.has(file.fileName)) inventory.set(file.fileName, file)
			if (!page.nextFileName || page.nextFileName > end) break
			start = page.nextFileName
		}
		this.inventory = inventory
		this.inventoriedNames = wanted
	}

	private async upload(
		name: string,
		body: Buffer,
		contentType: string,
	): Promise<void> {
		await this.withReauthorization(() =>
			this.uploadOnce(name, body, contentType),
		)
	}

	private async uploadOnce(
		name: string,
		body: Buffer,
		contentType: string,
	): Promise<void> {
		this.assertArtifactName(name)
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
			},
		)
		if (urlResponse.status === 401) throw new B2AuthorizationExpired()
		if (!urlResponse.ok)
			throw new Error(
				`B2 upload URL request failed (${await failure(urlResponse)})`,
			)
		const target = (await urlResponse.json()) as {
			uploadUrl: string
			authorizationToken: string
		}
		const sha1 = createHash("sha1").update(body).digest("hex")
		const response = await request(
			target.uploadUrl,
			{
				method: "POST",
				headers: {
					Authorization: target.authorizationToken,
					"X-Bz-File-Name": encodeName(name),
					"X-Bz-Content-Sha1": sha1,
					"Content-Type": contentType,
					"Content-Length": String(body.length),
				},
				body: Uint8Array.from(body),
			},
			retryDelays,
			objectTimeout,
		)
		if (response.status === 401) throw new B2AuthorizationExpired()
		if (!response.ok)
			throw new Error(`B2 upload failed (${await failure(response)})`)
	}

	async putImmutable(
		name: string,
		body: Buffer,
		contentType: string,
	): Promise<"created" | "exists"> {
		this.assertArtifactName(name)
		const listed = this.inventory?.get(name)
		if (
			this.inventoriedNames?.has(name) &&
			listed?.contentLength === body.length &&
			listed.contentSha1 === createHash("sha1").update(body).digest("hex")
		)
			return "exists"
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
