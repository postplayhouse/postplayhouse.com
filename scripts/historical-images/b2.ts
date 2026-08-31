import type { ArtifactStore } from "./store"

interface B2Auth {
	authorizationToken: string
	apiUrl: string
	downloadUrl: string
}

interface Credentials {
	keyId: string
	applicationKey: string
	bucketName: string
	bucketId?: string
}

const requestTimeout = 30_000
const objectTimeout = 5 * 60_000

function encodeName(name: string): string {
	return name.split("/").map(encodeURIComponent).join("/")
}

export class B2ArtifactStore implements ArtifactStore {
	private authPromise?: Promise<B2Auth>

	constructor(private readonly credentials: Credentials) {}

	private authorize(): Promise<B2Auth> {
		return (this.authPromise ??= (async () => {
			const authorization = Buffer.from(
				`${this.credentials.keyId}:${this.credentials.applicationKey}`,
			).toString("base64")
			const response = await fetch(
				"https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
				{
					headers: { Authorization: `Basic ${authorization}` },
					signal: AbortSignal.timeout(requestTimeout),
				},
			)
			if (!response.ok)
				throw new Error(`B2 authorization failed (${response.status})`)
			return (await response.json()) as B2Auth
		})())
	}

	async get(name: string): Promise<Buffer | null> {
		const auth = await this.authorize()
		const response = await fetch(
			`${auth.downloadUrl}/file/${encodeURIComponent(this.credentials.bucketName)}/${encodeName(name)}`,
			{
				headers: { Authorization: auth.authorizationToken },
				signal: AbortSignal.timeout(objectTimeout),
			},
		)
		if (response.status === 404) return null
		if (!response.ok) throw new Error(`B2 download failed (${response.status})`)
		return Buffer.from(await response.arrayBuffer())
	}

	private async upload(
		name: string,
		body: Buffer,
		contentType: string,
	): Promise<void> {
		if (!this.credentials.bucketId)
			throw new Error("B2 bucket ID is required for publishing")
		const auth = await this.authorize()
		const urlResponse = await fetch(
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
			throw new Error(`B2 upload URL request failed (${urlResponse.status})`)
		const target = (await urlResponse.json()) as {
			uploadUrl: string
			authorizationToken: string
		}
		const sha1 = (await import("node:crypto"))
			.createHash("sha1")
			.update(body)
			.digest("hex")
		const response = await fetch(target.uploadUrl, {
			method: "POST",
			headers: {
				Authorization: target.authorizationToken,
				"X-Bz-File-Name": encodeName(name),
				"X-Bz-Content-Sha1": sha1,
				"Content-Type": contentType,
				"Content-Length": String(body.length),
				"X-Bz-Info-src_last_modified_millis": "0",
				"X-Bz-Info-b2-content-disposition": "inline",
				"X-Bz-Info-b2-cache-control": "private, max-age=31536000, immutable",
			},
			body: Uint8Array.from(body),
			signal: AbortSignal.timeout(objectTimeout),
		})
		if (!response.ok) throw new Error(`B2 upload failed (${response.status})`)
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
