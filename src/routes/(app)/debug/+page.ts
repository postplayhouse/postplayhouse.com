import { error } from "@sveltejs/kit"
import * as site from "$data/site"

export async function load(obj) {
	const season = site.showsAnnounced
		? site.season
		: ((site.season - 1) as Date.Year)
	const res = await obj.fetch(`/data/productions/${season}.json`)
	const data = await res.json()

	if (res.status === 200) {
		return {
			productions: data.productions as Production[],
		}
	} else {
		error(500, `could not fetch /data/productions/${season}.json`)
	}
}
