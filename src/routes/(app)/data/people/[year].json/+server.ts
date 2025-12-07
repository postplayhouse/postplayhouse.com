import { error, json } from "@sveltejs/kit"
import * as site from "$data/site"
import data from "$data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"

export const prerender = true

export const GET: RequestHandler = (req) => {
	const year = req.params["year"]
	if (!year) {
		return error(400, "Year parameter is required")
	}

	const people = data.people[year as keyof typeof data.people]

	if (!people) {
		return error(404, `No data found for year ${year}`)
	}

	return json({ site, people })
}
