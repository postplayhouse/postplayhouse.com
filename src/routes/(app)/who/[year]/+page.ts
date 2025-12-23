import { error } from "@sveltejs/kit"
import { season } from "$data/site"

export async function load(obj) {
	const year = obj.params["year"]
	const yearNum = parseInt(year, 10)

	// Use SSR endpoint for current season (to get approved bios from Blobs)
	// Use prerendered endpoint for historical years
	const endpoint =
		yearNum === season
			? `/api/people/${year}.json`
			: `/data/people/${year}.json`

	const res = await obj.fetch(endpoint)
	const data = await res.json()

	if (res.status === 200) {
		return {
			people: data.people as YamlPerson[],
			year,
		}
	} else {
		error(500, data.message)
	}
}
