import { env } from "$env/dynamic/private"
import { isProduction } from "$lib/server/env"

// B2 authorize account response type
interface AuthorizeAccountSuccessResponse {
	accountId: string
	authorizationToken: string
	absoluteMinimumPartSize: number
	allowed: {
		capabilities: string[]
		bucketId?: string
		bucketName?: string
		namePrefix?: string
	}
	apiUrl: string
	downloadUrl: string
	recommendedPartSize: number
}

/**
 * Get B2 configuration based on environment.
 * Uses test bucket for dev/test, production bucket for production.
 */
function getB2Config() {
	const useTestBucket = !isProduction()
	return {
		keyId: env["B2_APPLICATION_KEY_ID"] ?? "",
		key: env["B2_APPLICATION_KEY"] ?? "",
		bucketId: useTestBucket
			? env["B2_TEST_BUCKET_ID"] ?? ""
			: env["B2_BUCKET_ID"] ?? "",
		bucketName: useTestBucket
			? env["B2_TEST_BUCKET_NAME"] ?? ""
			: env["B2_BUCKET_NAME"] ?? "",
	}
}

function base64Encode(str: string): string {
	return Buffer.from(str).toString("base64")
}

/**
 * Authorize with B2 and get API URL + auth token.
 * Token is valid for 24 hours.
 */
async function authorizeB2(): Promise<AuthorizeAccountSuccessResponse> {
	const config = getB2Config()
	const auth = "Basic " + base64Encode(`${config.keyId}:${config.key}`)

	const resp = await fetch(
		"https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
		{
			headers: { Authorization: auth },
			method: "GET",
		},
	)

	if (!resp.ok) {
		const errorText = await resp.text()
		throw new Error(`Could not authorize B2 account: ${errorText}`)
	}

	return resp.json()
}

/**
 * Get upload credentials (URL + token) for the configured bucket.
 */
export async function getB2UploadCreds(): Promise<{
	uploadUrl: string
	authorizationToken: string
}> {
	const config = getB2Config()
	const authData = await authorizeB2()

	const resp = await fetch(authData.apiUrl + "/b2api/v2/b2_get_upload_url", {
		method: "POST",
		body: JSON.stringify({ bucketId: config.bucketId }),
		headers: { Authorization: authData.authorizationToken },
	})

	if (!resp.ok) {
		const errorText = await resp.text()
		throw new Error(`Could not get B2 upload URL: ${errorText}`)
	}

	const { uploadUrl, authorizationToken } = (await resp.json()) as {
		uploadUrl: string
		authorizationToken: string
	}

	return { uploadUrl, authorizationToken }
}

/**
 * Upload a File to B2.
 * @param file - The File object to upload
 * @param fileName - The path/name for the file in B2 (e.g., "originals/2026/john-doe.jpg")
 * @returns The fileName as stored in B2
 */
export async function uploadFileToB2(
	file: File,
	fileName: string,
): Promise<string> {
	const { uploadUrl, authorizationToken } = await getB2UploadCreds()

	const resp = await fetch(uploadUrl, {
		method: "POST",
		headers: {
			"Content-Type": file.type,
			Authorization: authorizationToken,
			"X-Bz-Content-Sha1": "do_not_verify",
			"X-Bz-File-Name": encodeURIComponent(fileName),
			"Content-Length": file.size.toString(),
		},
		body: file,
	})

	if (!resp.ok) {
		const errorText = await resp.text()
		throw new Error(`Could not upload file to B2: ${errorText}`)
	}

	const result = (await resp.json()) as { fileName: string }
	return result.fileName
}

/**
 * Upload a Buffer to B2 (useful for processed images).
 * @param buffer - The Buffer to upload
 * @param fileName - The path/name for the file in B2
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @returns The fileName as stored in B2
 */
export async function uploadBufferToB2(
	buffer: Buffer,
	fileName: string,
	contentType: string,
): Promise<string> {
	const { uploadUrl, authorizationToken } = await getB2UploadCreds()

	// Convert Buffer to Uint8Array for fetch compatibility
	const uint8Array = new Uint8Array(buffer)

	const resp = await fetch(uploadUrl, {
		method: "POST",
		headers: {
			"Content-Type": contentType,
			Authorization: authorizationToken,
			"X-Bz-Content-Sha1": "do_not_verify",
			"X-Bz-File-Name": encodeURIComponent(fileName),
			"Content-Length": buffer.length.toString(),
		},
		body: uint8Array,
	})

	if (!resp.ok) {
		const errorText = await resp.text()
		throw new Error(`Could not upload buffer to B2: ${errorText}`)
	}

	const result = (await resp.json()) as { fileName: string }
	return result.fileName
}

/**
 * Download a file from B2.
 * @param filePath - The path/name of the file in B2
 * @returns The file contents as a Buffer
 */
export async function downloadFromB2(filePath: string): Promise<Buffer> {
	const config = getB2Config()
	const authData = await authorizeB2()

	// B2 download URL format: {downloadUrl}/file/{bucketName}/{fileName}
	const downloadUrl = `${authData.downloadUrl}/file/${config.bucketName}/${filePath}`

	const resp = await fetch(downloadUrl, {
		headers: { Authorization: authData.authorizationToken },
	})

	if (!resp.ok) {
		throw new Error(`Could not download file from B2: ${resp.status}`)
	}

	return Buffer.from(await resp.arrayBuffer())
}

/**
 * Get the public URL for a file in B2.
 * Note: This assumes the bucket has public access enabled.
 * @param filePath - The path/name of the file in B2
 * @returns The public URL
 */
export function getB2PublicUrl(filePath: string): string {
	const config = getB2Config()
	// Standard B2 public URL format
	return `https://f002.backblazeb2.com/file/${config.bucketName}/${filePath}`
}
