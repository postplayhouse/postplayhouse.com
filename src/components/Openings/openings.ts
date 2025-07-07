import { combineShows, dslToData } from "$components/Calendar/calendarHelpers"
import { asserted, objectEntries, objectKeys } from "$helpers"

function dumbLeftPad(num: number): `${number}` {
	return (String(num).length === 1 ? `0${num}` : num) as `${number}`
}

export function findClosingDate(
	year: Date.Year,
	productions: Array<Pick<Production, "dates">>,
): `${number}-${number}-${number}` {
	const eachProductionDates = productions.map((prodData) => {
		const venueDates = Object.entries(prodData.dates).map(([_, dateString]) =>
			dslToData(
				{
					year,
					venue: "",
					title: "",
					color: "",
				},
				dateString,
			),
		)

		return combineShows(...venueDates)
	})
	const allProductionsDates = combineShows(...eachProductionDates)
	const monthsObj = asserted(
		allProductionsDates[year],
		"This year was not present to find the closing date",
	)

	const month = Math.max(
		...objectEntries(monthsObj)
			.filter(([_, content]) => objectKeys(content || {}).length > 0)
			.map(([monthkey]) => Number(monthkey)),
	) as Date.Month

	const daysObj = asserted(
		monthsObj[month],
		`Month ${month} not present in ${objectKeys(monthsObj)}`,
	)

	const day = Math.max(...objectKeys(daysObj).map((dk) => Number(dk)))

	return `${year}-${dumbLeftPad(month)}-${dumbLeftPad(day)}`
}
