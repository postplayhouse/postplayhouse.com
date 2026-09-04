import { downloadFromB2 } from "$lib/server/b2"
import { approvedHistoricalHeadshot } from "$lib/server/bio-headshots"
import { error } from "@sveltejs/kit"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
	individualPassphraseDetails,
	isAdmin,
} from "../../../bio-submission/passphraseHelpers"

const b2OriginalImagePath =
	/^originals\/\d{4}\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:avif|gif|heif|jpe?g|png|webp)$/i
const b2OptimizedImagePath =
	/^optimized\/\d{4}\/[A-Za-z0-9][A-Za-z0-9._-]*\.jpg$/i
const localImagePrefix = "src/images/people/"

const contentTypes: Record<string, string> = {
	avif: "image/avif",
	gif: "image/gif",
	heif: "image/heif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
}

function authenticatedRequest(request: Request, url: URL): Request {
	if (request.headers.has("Authorization")) return request

	const queryAuth = url.searchParams.get("auth")
	if (!queryAuth) return request

	const headers = new Headers(request.headers)
	headers.set("Authorization", queryAuth)
	return new Request(request, { headers })
}

export const GET = async ({ request, url }) => {
	let auth
	try {
		auth = individualPassphraseDetails(authenticatedRequest(request, url))
	} catch {
		return error(403, { message: "Invalid passphrase" })
	}

	if (!auth.correct || !isAdmin(auth.position)) {
		return error(403, { message: "Admin access required" })
	}

	const imagePath = url.searchParams.get("path")
	if (!imagePath) return error(400, { message: "Image path is required" })

	let image: Buffer
	if (
		b2OriginalImagePath.test(imagePath) ||
		b2OptimizedImagePath.test(imagePath)
	) {
		image = await downloadFromB2(imagePath)
	} else if (
		imagePath.startsWith(localImagePrefix) &&
		approvedHistoricalHeadshot(imagePath.slice(localImagePrefix.length))
	) {
		image = await readFile(resolve(imagePath))
	} else {
		return error(400, { message: "Invalid image path" })
	}

	const extension = imagePath
		.slice(imagePath.lastIndexOf(".") + 1)
		.toLowerCase()
	return new Response(new Uint8Array(image), {
		headers: {
			"Cache-Control": "private, no-store",
			"Content-Type": contentTypes[extension],
			"X-Content-Type-Options": "nosniff",
		},
	})
}
