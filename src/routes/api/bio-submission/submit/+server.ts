import { error, json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { savePendingBio, type PendingBio } from "$lib/server/blobs"
import { uploadFileToB2 } from "$lib/server/b2"
import * as site from "$data/site"

function toKebabCase(str: string) {
	return str
		.trim()
		.toLowerCase()
		.replace(/[^a-z]+/gi, "-")
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
		// B2 module automatically uses test bucket in dev/test environments
		const ext =
			imageFile.type.split("/")[1] === "jpeg"
				? "jpg"
				: imageFile.type.split("/")[1]
		const fileName = `originals/${season}/${kebabName}.${ext}`

		try {
			originalImageUrl = await uploadFileToB2(imageFile, fileName)
		} catch (err) {
			console.error("B2 upload error:", err)
			return error(500, {
				message: "Failed to upload image. Please try again.",
			})
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
