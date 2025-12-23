import { error, json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { savePendingBio, type PendingBio } from "$lib/server/blobs"
import { env } from "$env/dynamic/private"
import * as site from "$data/site"
import { dev } from "$app/environment"
import type { AuthorizeAccountSuccessResponse } from "../upload-url/b2-types"

function toKebabCase(str: string) {
	return str
		.trim()
		.toLowerCase()
		.replace(/[^a-z]+/gi, "-")
}

const b2Creds = {
	keyId: env["B2_APPLICATION_KEY_ID"],
	key: env["B2_APPLICATION_KEY"],
	bucketId: env["B2_BUCKET_ID"],
}

function base64Encode(str: string) {
	return Buffer.from(str).toString("base64")
}

async function getB2UploadCreds(): Promise<{
	uploadUrl: string
	authorizationToken: string
}> {
	const auth = "Basic " + base64Encode(`${b2Creds.keyId}:${b2Creds.key}`)
	const authorizeEndpoint =
		"https://api.backblazeb2.com/b2api/v2/b2_authorize_account"

	const resp = await fetch(authorizeEndpoint, {
		headers: { Authorization: auth },
		method: "GET",
	})

	if (!resp.ok) {
		throw new Error("Could not authorize account for storage provider")
	}

	const authData = (await resp.json()) as AuthorizeAccountSuccessResponse

	const resp2 = await fetch(authData.apiUrl + "/b2api/v2/b2_get_upload_url", {
		method: "POST",
		body: JSON.stringify({ bucketId: b2Creds.bucketId }),
		headers: { Authorization: authData.authorizationToken },
	})

	if (!resp2.ok) {
		throw new Error(
			"Could not fetch upload endpoint details from the storage provider",
		)
	}

	const { uploadUrl, authorizationToken } = (await resp2.json()) as {
		uploadUrl: string
		authorizationToken: string
	}

	return { uploadUrl, authorizationToken }
}

async function uploadImageToB2(
	imageFile: File,
	fileName: string,
): Promise<string> {
	const { uploadUrl, authorizationToken } = await getB2UploadCreds()

	const resp = await fetch(uploadUrl, {
		method: "POST",
		headers: {
			"Content-Type": imageFile.type,
			Authorization: authorizationToken,
			"X-Bz-Content-Sha1": "do_not_verify",
			"X-Bz-File-Name": fileName,
			"Content-Length": imageFile.size.toString(),
		},
		body: imageFile,
	})

	if (!resp.ok) {
		const errorText = await resp.text()
		throw new Error(`Could not upload image to B2: ${errorText}`)
	}

	const result = (await resp.json()) as { fileName: string }
	// Return the public B2 URL for the file
	// The bucket name is typically extracted from the download URL in authData
	// For now, construct a reasonable URL path
	return `originals/${result.fileName}`
}

export const POST = async ({ request }) => {
	const { correct, position } = individualPassphraseDetails(request)

	if (!correct) {
		return json(
			{
				error: "Invalid Passphrase",
				message: "The passphrase you gave was incorrect.",
			},
			{ status: 403 },
		)
	}

	const fd = await request.formData()

	const firstName = fd.get("firstName") as string
	const lastName = fd.get("lastName") as string
	const location = fd.get("location") as string
	const email = fd.get("email") as string
	const bio = fd.get("bio") as string
	const programBio = fd.get("programBio") as string | null
	const staffPositionsJson = fd.get("staffPositions") as string | null
	const productionPositionsJson = fd.get("productionPositions") as string | null
	const rolesJson = fd.get("roles") as string | null
	const imageFile = fd.get("imageFile") as File | null
	const useOldHeadshot = fd.get("useOldHeadshot") === "true"
	const oldImageSrcPath = fd.get("oldImageSrcPath") as string | null

	// Validate required fields
	if (!firstName || !lastName || !location || !email || !bio) {
		return json(
			{
				error: "Missing Fields",
				message: "Please fill out all required fields.",
			},
			{ status: 400 },
		)
	}

	// Either need a new image or using an old one
	if (!imageFile && !useOldHeadshot) {
		return json(
			{
				error: "Missing Image",
				message: "Please provide a headshot image.",
			},
			{ status: 400 },
		)
	}

	if (useOldHeadshot && !oldImageSrcPath) {
		return json(
			{
				error: "Missing Old Image",
				message: "Please select an old headshot to use.",
			},
			{ status: 400 },
		)
	}

	const season = site.season
	const name = `${firstName} ${lastName}`
	const kebabName = toKebabCase(name)

	let originalImageUrl: string

	if (useOldHeadshot && oldImageSrcPath) {
		// Using an old headshot - store the path as the "original" reference
		originalImageUrl = oldImageSrcPath
	} else if (imageFile) {
		// Upload new image to B2 originals/ folder
		const ext =
			imageFile.type.split("/")[1] === "jpeg"
				? "jpg"
				: imageFile.type.split("/")[1]
		const fileName = `originals/${season}/${kebabName}.${ext}`

		if (dev) {
			// In dev mode, skip actual B2 upload and use a placeholder
			originalImageUrl = fileName
		} else {
			try {
				originalImageUrl = await uploadImageToB2(imageFile, fileName)
			} catch (err) {
				console.error("B2 upload error:", err)
				return error(500, {
					message: "Failed to upload image. Please try again.",
				})
			}
		}
	} else {
		return error(400, { message: "No image provided" })
	}

	// Parse JSON fields
	const staffPositions = staffPositionsJson
		? (JSON.parse(staffPositionsJson) as string[])
		: undefined

	const productionPositions = productionPositionsJson
		? (JSON.parse(productionPositionsJson) as Record<string, string[]>)
		: undefined

	const roles = rolesJson
		? (JSON.parse(rolesJson) as Record<string, string[]>)
		: undefined

	// Extract imageYear from old image path if using old headshot
	let imageYear = season
	if (useOldHeadshot && oldImageSrcPath) {
		const yearMatch = oldImageSrcPath.match(/\/(\d{4})\//)
		if (yearMatch) {
			imageYear = parseInt(yearMatch[1], 10)
		}
	}

	const pendingBio: PendingBio = {
		position,
		firstName,
		lastName,
		location,
		email,
		bio,
		programBio: programBio || undefined,
		staffPositions,
		productionPositions,
		roles,
		originalImageUrl,
		imageYear,
		submittedAt: new Date().toISOString(),
	}

	try {
		await savePendingBio(season, pendingBio)
	} catch (err) {
		console.error("Blobs save error:", err)
		return error(500, { message: "Failed to save bio. Please try again." })
	}

	return json({
		success: true,
		message: "Bio submitted successfully and is pending approval.",
	})
}
