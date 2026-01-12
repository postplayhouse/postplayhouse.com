import { json, error } from "@sveltejs/kit"
import {
	individualPassphraseDetails,
	isAdmin,
} from "../../../bio-submission/passphraseHelpers.js"
import { getPendingBio, approveBio } from "$lib/server/blobs"
import { downloadFromB2, uploadBufferToB2 } from "$lib/server/b2"
import {
	processHeadshotImage,
	getOptimizedImagePath,
} from "$lib/server/imageProcessing"
import { season } from "$data/seasons"
import * as fs from "node:fs/promises"
import * as path from "node:path"

export const POST = async ({ request }) => {
	// Validate admin access
	let adminPosition: number
	try {
		const { correct, position } = individualPassphraseDetails(request)
		if (!correct) {
			return error(403, { message: "Invalid passphrase" })
		}
		adminPosition = position
	} catch (err) {
		return error(403, { message: "Invalid passphrase" })
	}

	if (!isAdmin(adminPosition)) {
		return error(403, { message: "Admin access required" })
	}

	// Parse request body
	const body = await request.json()
	const bioPosition = body.position as number

	if (typeof bioPosition !== "number") {
		return error(400, { message: "Position is required" })
	}

	// Fetch the pending bio
	const pendingBio = await getPendingBio(season, bioPosition)

	if (!pendingBio) {
		return error(404, { message: "Pending bio not found" })
	}

	try {
		// Step 1: Fetch original image
		let imageBuffer: Buffer

		if (pendingBio.originalImageUrl.startsWith("src/images/")) {
			// Old headshot from filesystem
			const fullPath = path.join(process.cwd(), pendingBio.originalImageUrl)
			imageBuffer = await fs.readFile(fullPath)
		} else {
			// New upload from B2
			imageBuffer = await downloadFromB2(pendingBio.originalImageUrl)
		}

		// Step 2: Process image with Sharp
		const optimizedBuffer = await processHeadshotImage(imageBuffer)

		// Step 3: Upload optimized image to B2
		const optimizedPath = getOptimizedImagePath(
			season,
			pendingBio.firstName,
			pendingBio.lastName,
		)
		await uploadBufferToB2(optimizedBuffer, optimizedPath, "image/jpeg")

		// Step 4: Move bio to approved status
		const approvedBy = `admin-position-${adminPosition}`
		const approvedBio = await approveBio(
			season,
			bioPosition,
			approvedBy,
			optimizedPath,
		)

		return json({
			success: true,
			bio: approvedBio,
			optimizedImageUrl: optimizedPath,
		})
	} catch (err) {
		console.error("Failed to approve bio:", err)
		return error(500, {
			message: `Failed to approve bio: ${err instanceof Error ? err.message : "Unknown error"}`,
		})
	}
}
