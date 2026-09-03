import { error } from "@sveltejs/kit"
import * as site from "$data/site"
import { historicalImages } from "$lib/server/historical-images"

export async function load(obj) {
	const season = site.showsAnnounced
		? site.season
		: ((site.season - 1) as Date.Year)
	const res = await obj.fetch(`/data/productions/${season}.json`)
	const data = await res.json()

	if (res.status === 200) {
		return {
			productions: data.productions,
			season: season,
			historicalImages: historicalImages({
				seasons: (data.productions as Production[]).flatMap((production) =>
					production.image ? [`${season}/${production.image}`] : [],
				),
			}),
		}
	} else {
		error(500, `could not fetch /data/productions/${season}.json`)
	}
}
