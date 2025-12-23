import { error } from "@sveltejs/kit"
import { season } from "$data/site"
import { personImageKey } from "$lib/historical-images"
import { historicalImages } from "$lib/server/historical-images"
import { toPerson } from "$models/Person"

export async function load(obj) {
	const year = obj.params["year"]
	const endpoint =
		parseInt(year, 10) === season
			? `/api/people/${year}.json`
			: `/data/people/${year}.json`
	const res = await obj.fetch(endpoint)
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
