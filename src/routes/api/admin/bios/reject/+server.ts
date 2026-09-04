import { error, json } from "@sveltejs/kit"
import { z } from "zod"
import {
	individualPassphraseDetails,
	isAdmin,
} from "../../../bio-submission/passphraseHelpers.js"
import { deletePendingBio, getPendingBio } from "$lib/server/blobs"
import { season } from "$data/seasons"
import { sendMessageToChatRoom } from "../../../basecamp.server"

const rejectionSchema = z
	.object({
		position: z.number().int().positive(),
		reason: z.string().optional(),
	})
	.strict()

export const POST = async ({ request, fetch }) => {
	let adminPosition: number
	try {
		const details = individualPassphraseDetails(request)
		if (!details.correct) {
			return error(403, { message: "Invalid passphrase" })
		}
		adminPosition = details.position
	} catch {
		return error(403, { message: "Invalid passphrase" })
	}

	if (!isAdmin(adminPosition)) {
		return error(403, { message: "Admin access required" })
	}

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return error(400, { message: "Invalid JSON body" })
	}

	const parsedBody = rejectionSchema.safeParse(body)
	if (!parsedBody.success) {
		return error(400, {
			message:
				"Body must contain a positive integer position and optional string reason",
		})
	}

	const { position, reason } = parsedBody.data
	let pendingBio
	try {
		pendingBio = await getPendingBio(season, position)
	} catch (err) {
		console.error("Failed to fetch pending bio for rejection:", err)
		return error(500, { message: "Failed to fetch pending bio" })
	}

	if (!pendingBio) {
		return error(404, { message: "Pending bio not found" })
	}

	try {
		await deletePendingBio(season, position)
	} catch (err) {
		console.error("Failed to delete rejected pending bio:", err)
		return error(500, { message: "Failed to delete pending bio" })
	}

	const content = [
		`Admin position ${adminPosition} rejected the bio submitted by ${pendingBio.firstName} ${pendingBio.lastName} (position ${pendingBio.position}, ${pendingBio.email}).`,
		"Discussion about this rejection belongs in Basecamp.",
		reason?.trim() ? `Reason: ${reason.trim()}` : undefined,
	]
		.filter(Boolean)
		.join("\n")

	try {
		const response = await sendMessageToChatRoom(fetch, "admin", content)
		if (response && !response.ok) {
			throw new Error(`Basecamp returned ${response.status}`)
		}
	} catch (err) {
		console.error("Failed to notify Basecamp of bio rejection:", err)
		return error(502, {
			message: "Bio rejected, but Basecamp notification failed",
		})
	}

	return json({ success: true })
}
