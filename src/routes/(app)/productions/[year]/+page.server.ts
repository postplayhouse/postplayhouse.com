import { error } from "@sveltejs/kit"
import * as site from "$data/site"
import { historicalImages } from "$lib/server/historical-images"
import type { HistoricalImagePageData } from "$lib/historical-images"

function imageKeys(
	year: number,
	items: Array<Production | SpecialEvent | Series>,
): string[] {
	return items.flatMap((item) => [
		...(item.image ? [`${year}/${item.image}`] : []),
		...("events" in item ? imageKeys(year, item.events) : []),
	])
}

type ResponseData =
	| {
			productions: Production[]
			specialEvents: SpecialEvent[]
			series: Series[]
			year: Date.Year
			seasonAnnounced: true
			historicalImages: HistoricalImagePageData
	  }
	| {
			productions: never[]
			specialEvents: never[]
			series: never[]
			year: Date.Year
			seasonAnnounced: false
			historicalImages: HistoricalImagePageData
	  }

export async function load(obj) {
	if (!site.showsAnnounced && parseInt(obj.params["year"]) === site.season) {
		return {
			productions: [],
			specialEvents: [],
			series: [],
			year: parseInt(obj.params["year"]) as Date.Year,
			seasonAnnounced: false,
			historicalImages: historicalImages({}),
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
			historicalImages: historicalImages({
				seasons: [
					`${obj.params["year"]}/full-season.jpg`,
					...imageKeys(Number(obj.params["year"]), [
						...data.productions,
						...data.specialEvents,
						...data.series,
					]),
				],
			}),
		} satisfies ResponseData
	} else {
		error(500, `could not fetch /data/productions/${obj.params["year"]}.json`)
	}
}
