import { createHash } from "node:crypto"
import { createReadStream, createWriteStream, statSync } from "node:fs"
import { pipeline } from "node:stream/promises"
import { Readable } from "node:stream"

interface B2Auth {
	authorizationToken: string
	apiUrl: string
	downloadUrl: string
}

interface UploadUrl {
	uploadUrl: string
	authorizationToken: string
}

export interface B2Credentials {
	keyId: string
	applicationKey: string
	bucketId?: string
	bucketName: string
}

const requestTimeout = 30_000
const downloadTimeout = 3 * 60_000
const uploadTimeout = 15 * 60_000

async function authorize(credentials: B2Credentials): Promise<B2Auth> {
	const authorization = Buffer.from(
		`${credentials.keyId}:${credentials.applicationKey}`,
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
}

function encodeName(name: string): string {
	return name.split("/").map(encodeURIComponent).join("/")
}

export async function downloadObject(
	credentials: B2Credentials,
	name: string,
): Promise<Buffer | null> {
	const auth = await authorize(credentials)
	const response = await fetch(
		`${auth.downloadUrl}/file/${encodeURIComponent(credentials.bucketName)}/${encodeName(name)}`,
		{
			headers: { Authorization: auth.authorizationToken },
			signal: AbortSignal.timeout(requestTimeout),
		},
	)
	if (response.status === 404) return null
	if (!response.ok) throw new Error(`B2 download failed (${response.status})`)
	return Buffer.from(await response.arrayBuffer())
}

export async function downloadObjectToFile(
	credentials: B2Credentials,
	name: string,
	path: string,
): Promise<boolean> {
	const auth = await authorize(credentials)
	const response = await fetch(
		`${auth.downloadUrl}/file/${encodeURIComponent(credentials.bucketName)}/${encodeName(name)}`,
		{
			headers: { Authorization: auth.authorizationToken },
			signal: AbortSignal.timeout(downloadTimeout),
		},
	)
	if (response.status === 404) return false
	if (!response.ok || !response.body)
		throw new Error(`B2 download failed (${response.status})`)
	await pipeline(Readable.fromWeb(response.body), createWriteStream(path))
	return true
}

async function sha1File(path: string): Promise<string> {
	const hash = createHash("sha1")
	for await (const chunk of createReadStream(path)) hash.update(chunk)
	return hash.digest("hex")
}

async function upload(
	credentials: B2Credentials,
	name: string,
	body: Buffer | ReturnType<typeof createReadStream>,
	length: number,
	sha1: string,
	contentType: string,
): Promise<void> {
	if (!credentials.bucketId)
		throw new Error("B2 bucket ID is required for upload")
	const auth = await authorize(credentials)
	const uploadUrlResponse = await fetch(
		`${auth.apiUrl}/b2api/v2/b2_get_upload_url`,
		{
			method: "POST",
			headers: {
				Authorization: auth.authorizationToken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ bucketId: credentials.bucketId }),
			signal: AbortSignal.timeout(requestTimeout),
		},
	)
	if (!uploadUrlResponse.ok)
		throw new Error(
			`B2 upload URL request failed (${uploadUrlResponse.status})`,
		)
	const target = (await uploadUrlResponse.json()) as UploadUrl
	const response = await fetch(target.uploadUrl, {
		method: "POST",
		headers: {
			Authorization: target.authorizationToken,
			"X-Bz-File-Name": encodeName(name),
			"X-Bz-Content-Sha1": sha1,
			"Content-Type": contentType,
			"Content-Length": String(length),
		},
		body,
		duplex: "half",
		signal: AbortSignal.timeout(uploadTimeout),
	} as RequestInit)
	if (!response.ok) throw new Error(`B2 upload failed (${response.status})`)
}

export async function uploadFile(
	credentials: B2Credentials,
	name: string,
	path: string,
): Promise<void> {
	await upload(
		credentials,
		name,
		createReadStream(path),
		statSync(path).size,
		await sha1File(path),
		"application/gzip",
	)
}

export async function uploadJson(
	credentials: B2Credentials,
	name: string,
	value: unknown,
): Promise<void> {
	const body = Buffer.from(`${JSON.stringify(value)}\n`)
	await upload(
		credentials,
		name,
		body,
		body.length,
		createHash("sha1").update(body).digest("hex"),
		"application/json",
	)
}
