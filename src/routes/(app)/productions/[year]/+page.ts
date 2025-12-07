import { error } from "@sveltejs/kit"
import * as site from "$data/site"

type ResponseData =
	| {
			productions: Production[]
			specialEvents: SpecialEvent[]
			series: Series[]
			year: Date.Year
			seasonAnnounced: true
	  }
	| {
			productions: never[]
			specialEvents: never[]
			series: never[]
			year: Date.Year
			seasonAnnounced: false
	  }

export async function load(obj) {
	if (!site.showsAnnounced && parseInt(obj.params["year"]) === site.season) {
		return {
			productions: [],
			specialEvents: [],
			series: [],
			year: parseInt(obj.params["year"]) as Date.Year,
			seasonAnnounced: false,
		} satisfies ResponseData
	}
	const res = await obj.fetch(`/data/productions/${obj.params["year"]}.json`)
	const data = (await res.json()) as {
		productions: Production[]
		specialEvents: SpecialEvent[]
		series: Series[]
	}

	if (res.status === 200) {
		return {
			productions: data.productions,
			specialEvents: data.specialEvents,
			series: data.series,
			year: parseInt(obj.params["year"]) as Date.Year,
			seasonAnnounced: true,
		} satisfies ResponseData
	} else {
		error(500, `could not fetch /data/productions/${obj.params["year"]}.json`)
	}
}
