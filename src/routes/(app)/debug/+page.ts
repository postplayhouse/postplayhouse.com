import { error } from "@sveltejs/kit"
import site from "$data/site"

export async function load(obj) {
	const res = await obj.fetch(`/data/productions/${site.season}.json`)
	const data = await res.json()

	if (res.status === 200) {
		return {
			productions: data.productions as Production[],
		}
	} else {
		error(500, `could not fetch /data/productions/${site.season}.json`)
	}
}
