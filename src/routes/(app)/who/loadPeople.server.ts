import { error } from "@sveltejs/kit"
import { season } from "$data/site"
import { personImageKey } from "$lib/historical-images"
import { historicalImages } from "$lib/server/historical-images"
import { toPerson } from "$models/Person"
import type { PageServerLoad } from "./[year]/$types"

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const year = params.year
	const yearNum = parseInt(year, 10)
	const endpoint =
		yearNum === season
			? `/api/people/${year}.json`
			: `/data/people/${year}.json`

	if (yearNum === season) {
		setHeaders({
			"Cache-Control": "public, max-age=0",
			"Netlify-CDN-Cache-Control":
				"public, max-age=86400, stale-while-revalidate=3600",
			"Cache-Tag": `people-${year},bios`,
		})
	}

	const res = await fetch(endpoint)
	const data = await res.json()

	if (res.status === 200) {
		return {
			people: data.people as YamlPerson[],
			year,
			historicalImages: historicalImages({
				people: (data.people as YamlPerson[])
					.map((person) => personImageKey(toPerson(person).image))
					.filter((key): key is string => Boolean(key)),
			}),
		}
	} else {
		error(500, data.message)
	}
}
