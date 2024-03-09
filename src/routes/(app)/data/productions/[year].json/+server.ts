import { json } from "@sveltejs/kit"
import site from "$data/site"
import data from "$data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"
import { assert, asserted } from "$helpers"

export const prerender = true

function isProduction(
	x: (typeof data.productions)[string][number],
): x is Production {
	return !x.special_event
}

function isSpecialEvent(
	x: (typeof data.productions)[string][number],
): x is SpecialEvent {
	return !!x.special_event
}

type InitialSeriesContainer = { series: Series | null; events: SpecialEvent[] }

type FinalSeriesContainer = { series: Series; events: SpecialEvent[] }

function isSeriesContainer(
	x: InitialSeriesContainer,
): x is FinalSeriesContainer {
	const pass = !!x.series && x.events.length > 0
	assert(
		pass,
		"was expecting a full series container. Check titles and series names match up.",
	)

	return pass
}

function isPartOfSeries(x: SpecialEvent) {
	return !!(x.belongs_to_series || x.is_series)
}

function isNotPartOfSeries(x: SpecialEvent) {
	return !isPartOfSeries(x)
}

export const GET: RequestHandler = (req) => {
	const events = asserted(data.productions[req.params["year"] as string])
	const productions: Production[] = events.filter(isProduction) || []

	const specialEvents: SpecialEvent[] =
		events.filter(isSpecialEvent).filter(isNotPartOfSeries) || []

	const seriesArr = Object.values(
		events
			.filter(isSpecialEvent)
			.filter(isPartOfSeries)
			.reduce<Record<string, InitialSeriesContainer>>((acc, x) => {
				const key = x.is_series ? x.title : x.belongs_to_series
				if (!key) return acc

				const container: (typeof acc)[string] = acc[key] || {
					series: null,
					events: [],
				}

				if (x.is_series) {
					container.series = { ...x, is_series: true, events: [] }
				} else {
					container.events.push(x)
				}

				acc[key] = container

				return acc
			}, {}),
	)
		.filter(isSeriesContainer)
		.reduce<Series[]>((acc, { series, events }) => {
			series.events = events
			acc.push(series)
			return acc
		}, [])

	return json({
		site,
		productions,
		specialEvents,
		series: seriesArr,
	})
}
