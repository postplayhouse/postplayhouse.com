import { approvedHistoricalHeadshot } from "$lib/server/bio-headshots"
import { error, json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url }) => {
	const record = await approvedHistoricalHeadshot(
		url.searchParams.get("id") ?? "",
	)
	if (!record) error(404, "Unknown historical headshot")
	return json(record)
}
