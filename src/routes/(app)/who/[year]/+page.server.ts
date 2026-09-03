import { error } from "@sveltejs/kit"
import { personImageKey } from "$lib/historical-images"
import { historicalImages } from "$lib/server/historical-images"
import { toPerson } from "$models/Person"

export async function load(obj) {
	const res = await obj.fetch(`/data/people/${obj.params["year"]}.json`)
	const data = await res.json()

	if (res.status === 200) {
		return {
			people: data.people as YamlPerson[],
			year: obj.params["year"],
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
