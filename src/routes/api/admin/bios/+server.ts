import { error, json } from "@sveltejs/kit"
import {
	individualPassphraseDetails,
	isAdmin,
} from "../../bio-submission/passphraseHelpers.js"
import { listPendingBios } from "$lib/server/blobs"
import { checkedInGroups } from "$lib/server/bioMetadata"
import { season } from "$data/seasons"

export const GET = async ({ request }) => {
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

	const bios = await listPendingBios(season)
	return json({
		bios: bios.map((bio) => ({
			...bio,
			baselineGroups: checkedInGroups(season, bio.position),
		})),
	})
}
