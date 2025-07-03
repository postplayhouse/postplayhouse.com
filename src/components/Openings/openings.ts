import { combineShows, dslToData } from "$components/Calendar/calendarHelpers"
import site from "$data/site"
import { asserted, objectKeys } from "$helpers"

export function findClosingDate(
	productions: Production[],
): `${number}-${number}-${number}` {
	const eachProductionDates = productions.map((prodData) => {
		const venueDates = Object.entries(prodData.dates).map(
			([venue, dateString]) =>
				dslToData(
					{
						year: site.season,
						venue,
						title: prodData.short_title || prodData.title,
						color: prodData.color || "",
					},
					dateString,
				),
		)

		return combineShows(...venueDates)
	})
	const allProductionsDates = combineShows(...eachProductionDates)
	const monthsObj = asserted(
		allProductionsDates[site.season],
		"This year was not present to find the closing date",
	)

	const month = Math.max(
		...objectKeys(monthsObj).map((monthkey) => Number(monthkey)),
	) as Date.Month

	const daysObj = asserted(
		monthsObj[month],
		`Month ${month} not present in ${objectKeys(monthsObj)}`,
	)

	const day = Math.max(...objectKeys(daysObj).map((dk) => Number(dk)))

	return `${site.season}-${month}-${day}`
}
