import { error } from "@sveltejs/kit"
import * as site from "$data/site"

export async function load(obj) {
	if (!site.showsAnnounced) {
		return {
			people: [],
		}
	}
	const peopleRes = await obj.fetch(`/data/people/${site.season}.json`)
	const peopleData = await peopleRes.json()
	if (peopleRes.status !== 200) error(500, peopleData.message)

	return {
		people: peopleData.people as YamlPerson[],
	}
}
