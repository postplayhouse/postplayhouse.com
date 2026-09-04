import { yearsAsString } from "$data/validation"
import { downloadFromB2 } from "$lib/server/b2"
import {
	BiosExportError,
	createBiosExportZip,
	getCheckedInPeopleYaml,
	serializeApprovedBios,
} from "$lib/server/biosExport"
import { listApprovedBios } from "$lib/server/blobs"
import { error, type RequestHandler } from "@sveltejs/kit"
import {
	individualPassphraseDetails,
	isAdmin,
} from "../../bio-submission/passphraseHelpers"

export const GET: RequestHandler = async ({ request, url }) => {
	let auth
	try {
		auth = individualPassphraseDetails(request)
	} catch {
		return error(403, { message: "Invalid passphrase" })
	}
	if (!auth.correct || !isAdmin(auth.position)) {
		return error(403, { message: "Admin access required" })
	}

	const parsedYear = yearsAsString.safeParse(url.searchParams.get("year"))
	if (!parsedYear.success) {
		return error(400, { message: "A supported four-digit year is required" })
	}
	const year = parsedYear.data
	const source = getCheckedInPeopleYaml(year)
	if (source === undefined) {
		return error(404, {
			message: `Checked-in people YAML not found for ${year}`,
		})
	}

	let approvedBios
	try {
		approvedBios = await listApprovedBios(Number(year))
	} catch (cause) {
		console.error("Failed to list approved bios for export:", cause)
		return error(500, { message: "Failed to read approved bios" })
	}
	if (approvedBios.length === 0) {
		return error(404, { message: `No approved bios found for ${year}` })
	}

	let prepared
	try {
		prepared = serializeApprovedBios(source, approvedBios, year)
	} catch (cause) {
		if (cause instanceof BiosExportError) {
			return error(cause.status, { message: cause.message })
		}
		console.error("Failed to prepare bios export:", cause)
		return error(500, { message: "Failed to prepare bios export" })
	}

	const images = []
	try {
		for (const image of prepared.images) {
			images.push({ ...image, content: await downloadFromB2(image.b2Path) })
		}
	} catch (cause) {
		console.error("Failed to download an optimized bio image:", cause)
		return error(502, { message: "Failed to download an optimized bio image" })
	}

	let zip
	try {
		zip = await createBiosExportZip(year, prepared.yaml, images)
	} catch (cause) {
		console.error("Failed to create bios export ZIP:", cause)
		return error(500, { message: "Failed to create bios export ZIP" })
	}

	return new Response(Uint8Array.from(zip).buffer, {
		headers: {
			"Cache-Control": "private, no-store",
			"Content-Disposition": `attachment; filename="bios-${year}.zip"`,
			"Content-Type": "application/zip",
			"X-Content-Type-Options": "nosniff",
		},
	})
}
