import {
	assert,
	asserted,
	ensureArray,
	exists,
	objectEntries,
	objectKeys,
	objectValues,
} from "$helpers"

type Year = Date.Year
type Month = Date.Month
type Day = Date.Day

const monthRegexp = {
	jan: /^\s*jan\w* (.*)$/im,
	feb: /^\s*feb\w* (.*)$/im,
	mar: /^\s*mar\w* (.*)$/im,
	apr: /^\s*apr\w* (.*)$/im,
	may: /^\s*may\w* (.*)$/im,
	jun: /^\s*jun\w* (.*)$/im,
	jul: /^\s*jul\w* (.*)$/im,
	aug: /^\s*aug\w* (.*)$/im,
	sep: /^\s*sep\w* (.*)$/im,
	oct: /^\s*oct\w* (.*)$/im,
	nov: /^\s*nov\w* (.*)$/im,
	dec: /^\s*dec\w* (.*)$/im,
}

export const shortMonths = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const

export const weekdays = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const

export const secondsToMs = (num: number) => num * 1000
export const minutesToMs = (num: number) => secondsToMs(num) * 60
export const hoursToMs = (num: number) => minutesToMs(num) * 60

const parseDec = (x: string) => parseInt(x, 10)
export const timeStrToMs = (militaryTime: string) =>
	militaryTime
		.split(":")
		.map(parseDec)
		.reverse()
		.reduce(
			(acc, timePart, i) => acc + timePart * Math.pow(60, i + 1) * 1000,
			0,
		)

export const TEN_AM = timeStrToMs("10:00")
export const TWO_PM = timeStrToMs("14:00")
export const SEVEN_THIRTY_PM = timeStrToMs("19:30")
export const SIX_PM = timeStrToMs("18:00")
export const EIGHT_PM = timeStrToMs("20:00")
const DEFAULT_SHOW_TIME = EIGHT_PM

/* eslint-disable @typescript-eslint/no-explicit-any */
function sortBy<T extends Record<any, any>, A extends T[]>(
	arr: A,
	key: keyof T,
): A {
	return arr.sort(({ [key]: a }, { [key]: b }) => {
		if (typeof a === "string") return a < b ? -1 : a > b ? 1 : 0
		return a - b
	})
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type Showing = {
	msFromMidnight: number
	color: string
	venue: string
	title: string
}

export type MonthDetails = Partial<Record<Day, Showing[]>>

export type YearDetails = Partial<Record<Month, MonthDetails>>

export type CalendarData = Partial<Record<Year, YearDetails>>

export type SimpleDate = { year: Year; month: Month; day: Day }

export function dslToData<
	T extends {
		year: number
		color: string
		venue: string
		title: string
		legend?: IHash<number>
	},
>(
	{ year, color, legend = ONLY_LEGEND, venue, ...rest }: T,
	dslString: string,
): CalendarData {
	function datesToDateTimeObj(datesStr: string) {
		const obj: MonthDetails = {}
		const dayAndDetailsTuple: Array<[Date.Day, Showing]> = datesStr
			.split(/[, ]+/)
			.filter(Boolean)
			.map((token) => asserted(token.match(/(\d+)(.*)/)).slice(1, 3))
			.map(([day, legendKey]) => {
				assert(day)
				return [
					parseInt(day, 10) as Date.Day,
					{
						msFromMidnight: legend[legendKey || "default"] || DEFAULT_SHOW_TIME,
						color,
						venue,
						...rest,
					},
				]
			})

		dayAndDetailsTuple.forEach(
			([day, details]) => (obj[day] = ensureArray(obj[day]).concat(details)),
		)

		objectValues(obj)
			.filter(exists)
			.forEach((day) => sortBy(day, "msFromMidnight"))

		return obj
	}

	return {
		[year]: objectKeys(monthRegexp).reduce<YearDetails>((acc, month, i) => {
			acc[(i + 1) as Date.Month] = monthRegexp[month].test(dslString)
				? datesToDateTimeObj(asserted(dslString.match(monthRegexp[month])?.[1]))
				: {}

			return acc
		}, {}),
	}
}

export function combineShows(
	...showSchedule: Array<ReturnType<typeof dslToData>>
) {
	return showSchedule.reduce(
		(acc, schedule) => {
			objectEntries(schedule).forEach(([year, months]) => {
				if (!months) return
				if (!acc[year]) {
					acc[year] = {}
				}
				objectEntries(months).forEach(([month, days]) => {
					if (!days) return
					if (!acc[year]![month]) {
						acc[year]![month] = {}
					}
					objectEntries(days).forEach(([day, showings]) => {
						if (!showings) return
						if (!acc[year]![month]![day]) {
							acc[year]![month]![day] = []
						}
						acc[year]![month]![day]!.push(...showings)
						sortBy(acc[year]![month]![day]!, "msFromMidnight")
					})
				})
			})
			return acc
		},
		{} as Record<Year, Record<Month, Record<Day, Showing[]>>>,
	)
}

const ONLY_LEGEND = {
	a: TWO_PM,
	m: TEN_AM,
	e: EIGHT_PM,
	c: SIX_PM,
}

function addDay(date: SimpleDate | Date, days = 1): Date {
	const solid = makeSimpleDate(date)
	return new Date(solid.year, solid.month - 1, solid.day + days)
}

export function addMilliseconds(date: SimpleDate | Date, ms: number) {
	const dt = makeDate(date)
	const now = dt.getTime()
	return new Date(now + ms)
}

export function makeDate(date: SimpleDate | Date) {
	return date instanceof Date
		? date
		: new Date(date.year, date.month - 1, date.day)
}

const makeSimpleDate = (dt: Date | SimpleDate): SimpleDate =>
	dt instanceof Date
		? {
				year: dt.getFullYear() as Year,
				month: (dt.getMonth() + 1) as Month,
				day: dt.getDate() as Day,
			}
		: dt

function dateMatches(
	day1: Date | SimpleDate,
	day2: Date | SimpleDate,
): boolean {
	const date1 = makeSimpleDate(day1)
	const date2 = makeSimpleDate(day2)
	return (
		date1.year === date2.year &&
		date1.month === date2.month &&
		date1.day === date2.day
	)
}

export function getWeeksFromProductions(
	productions: Array<SpecialEvent | Production>,
	year: Year,
): Array<
	Array<{
		date: SimpleDate

		showings: Showing[]
	}>
> {
	const productionDates = productions.map((prodData) => {
		const venueDates = Object.entries(prodData.dates).map(
			([venue, dateString]) =>
				dslToData(
					{
						year,
						venue,
						legend: ONLY_LEGEND,
						title: prodData.short_title || prodData.title,
						color: prodData.color || "",
					},
					dateString,
				),
		)

		return combineShows(...venueDates)
	})
	const allProductionDates = combineShows(...productionDates)

	const performanceDays: Array<{ date: SimpleDate; showings: Showing[] }> = []

	Object.entries(allProductionDates[year] as YearDetails).forEach(
		([monthNum, daysObj]) => {
			Object.entries(daysObj).forEach(([dayNum, schedule]) => {
				if (schedule.length) {
					performanceDays.push({
						date: {
							year,
							month: parseInt(monthNum) as Month,
							day: parseInt(dayNum) as Day,
						},
						showings: schedule,
					})
				}
			})
		},
	)

	const [firstDt, lastDt] = [performanceDays[0], performanceDays.slice(-1)[0]]
		.map((x) => asserted(x).date)
		.map(makeDate) as [Date, Date]

	const weeks: Array<Array<{ date: Date; schedule: Showing[] }>> = [[]]
	let currentDt = firstDt

	while (currentDt <= lastDt) {
		if (
			// Sunday is 0
			currentDt.getDay() === 0 &&
			currentDt !== asserted(weeks[weeks.length - 1])[0]?.date
		) {
			weeks.push([])
		}

		asserted(weeks[weeks.length - 1]).push({
			date: currentDt,
			schedule:
				performanceDays.find((day) => dateMatches(day.date, currentDt))
					?.showings ?? [],
		})

		currentDt = addDay(currentDt)
	}

	return weeks.map((x) =>
		x.map((y) => ({
			date: makeSimpleDate(y.date),
			showings: y.schedule,
		})),
	)
}
