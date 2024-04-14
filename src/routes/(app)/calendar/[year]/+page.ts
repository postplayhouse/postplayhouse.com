import { error } from "@sveltejs/kit"

export async function load(obj) {
	const year = parseInt(obj.params["year"] as string) as Date.Year
	const res = await obj.fetch(`/data/productions/${year}.json`)
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
			year,
		}
	} else {
		error(500, data.message)
	}
}
