import { env } from "$env/dynamic/private"
import { json, error, type RequestHandler } from "@sveltejs/kit"
import { season } from "$data/seasons"
import { isProduction, isTest } from "$lib/server/env"
import {
	individualPassphraseDetails,
	isAdmin,
} from "../../../bio-submission/passphraseHelpers.js"

const cacheTag = "bios"
const warmUrls = [
	`/who/${season}/`,
	"/program-bios/",
	`/api/people/${season}.json`,
]

export const POST: RequestHandler = async ({ request, url }) => {
	let adminPosition: number
	try {
		const { correct, position } = individualPassphraseDetails(request)
		if (!correct) {
			return error(403, { message: "Invalid passphrase" })
		}
		adminPosition = position
	} catch {
		return error(403, { message: "Invalid passphrase" })
	}

	if (!isAdmin(adminPosition)) {
		return error(403, { message: "Admin access required" })
	}

	if (!isProduction() || isTest()) {
		console.info("Simulating bios cache purge and warming", {
			cacheTag,
			warmUrls,
		})
		return json({
			success: true,
			simulated: true,
			purge: { tag: cacheTag, success: true, status: "simulated" },
			warming: warmUrls.map((warmUrl) => ({
				url: warmUrl,
				success: true,
				status: "simulated",
			})),
		})
	}

	const token = env["NETLIFY_API_TOKEN"]
	const siteId = env["NETLIFY_SITE_ID"]
	if (!token || !siteId) {
		return json(
			{
				success: false,
				simulated: false,
				purge: {
					tag: cacheTag,
					success: false,
					status: "not-configured",
				},
				warming: warmUrls.map((warmUrl) => ({
					url: warmUrl,
					success: false,
					status: "skipped",
				})),
			},
			{ status: 500 },
		)
	}

	let purgeResponse: Response
	try {
		purgeResponse = await fetch("https://api.netlify.com/api/v1/purge", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ site_id: siteId, cache_tags: [cacheTag] }),
		})
	} catch (cause) {
		console.error("Failed to purge bios cache", cause)
		return json(
			{
				success: false,
				simulated: false,
				purge: { tag: cacheTag, success: false, status: null },
				warming: warmUrls.map((warmUrl) => ({
					url: warmUrl,
					success: false,
					status: "skipped",
				})),
			},
			{ status: 502 },
		)
	}

	if (!purgeResponse.ok) {
		return json(
			{
				success: false,
				simulated: false,
				purge: {
					tag: cacheTag,
					success: false,
					status: purgeResponse.status,
				},
				warming: warmUrls.map((warmUrl) => ({
					url: warmUrl,
					success: false,
					status: "skipped",
				})),
			},
			{ status: 502 },
		)
	}

	const warming = await Promise.all(
		warmUrls.map(async (warmUrl) => {
			try {
				const response = await fetch(new URL(warmUrl, url.origin))
				return {
					url: warmUrl,
					success: response.ok,
					status: response.status,
				}
			} catch (cause) {
				console.error(`Failed to warm ${warmUrl}`, cause)
				return { url: warmUrl, success: false, status: null }
			}
		}),
	)
	const success = warming.every((result) => result.success)

	return json(
		{
			success,
			simulated: false,
			purge: {
				tag: cacheTag,
				success: true,
				status: purgeResponse.status,
			},
			warming,
		},
		{ status: success ? 200 : 502 },
	)
}
