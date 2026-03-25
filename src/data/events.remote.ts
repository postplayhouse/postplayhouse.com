import { prerender } from "$app/server"
import { assert } from "$helpers"
import yamlData from "./_yaml"
import * as site from "./site"
import { yearsAsNumbers } from "./validation"

type EventsData =
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

function isProduction(x: __BaseEvent): x is Production {
	return !x.special_event
}

function isSpecialEvent(x: __BaseEvent): x is SpecialEvent {
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

export const getEvents = prerender(yearsAsNumbers, (year) => {
	if (!site.showsAnnounced && year === site.season) {
		return {
			productions: [],
			specialEvents: [],
			series: [],
			year,
			seasonAnnounced: false,
		} satisfies EventsData
	}
	const events = yamlData.productions[year]
	const productions: Production[] = events.filter(isProduction) || []

	const specialEvents: SpecialEvent[] =
		events.filter(isSpecialEvent).filter(isNotPartOfSeries) || []

	const series = Object.values(
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

	return {
		productions,
		specialEvents,
		series,
		year,
		seasonAnnounced: true,
	} satisfies EventsData
})
