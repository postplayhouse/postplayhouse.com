import { error } from "@sveltejs/kit"

export async function load(obj) {
	const res = await obj.fetch(`/data/productions/${obj.params["year"]}.json`)
	const data = (await res.json()) as {
		// If success:
		productions: Production[]
		specialEvents: SpecialEvent[]
		series: Series[]
		site: typeof import("../../../../data/site").site
		// If error:
		message: string
	}

	if (res.status === 200) {
		return {
			productions: data.productions,
			specialEvents: data.specialEvents,
			series: data.series,
			year: parseInt(obj.params["year"]) as Date.Year,
		}
	} else {
		error(500, `could not fetch /data/productions/${obj.params["year"]}.json`)
	}
}
