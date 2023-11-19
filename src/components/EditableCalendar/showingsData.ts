import { assert, asserted } from "$helpers"

export type ProductionDetails = {
	color: string
	shortTitle: string
	longTitle: string
}

export type PerformanceDetails = {
	id: string
	year: number
	month: number
	day: number
	slot: number
}

export type ShowingsData = {
	productions: ProductionDetails[]
	performances: PerformanceDetails[]
}

type StartingMonth = { startingMonth: number; startingYear: number }

const alpha31 = "abcdefghijklmnopqrstuvwxyzABCDE".split("")
const dateLookup = alpha31.reduce<Record<string, number>>(
	(acc, char, i) => ({ ...acc, [char]: i + 1 }),
	{},
)
const alphaLookup = alpha31.reduce<Record<number, string>>(
	(acc, char, i) => ({ ...acc, [i + 1]: char }),
	{},
)

function getMonthNum(num: number) {
	return ((num - 1) % 12) + 1
}

const FALLBACK_STARTING_DATE = (function () {
	const date = new Date()
	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate(),
	}
})()

/**
 * Forward slashes and brackets are used to demark show info bounds:
 *     "[color/short-title/long-title]"
 *
 * So a show with an actual forward slash, bracket, or backslash (since we use them for escaping)needs to be escaped.
 */
export function escapeTitle(title: string) {
	return title
		.replace(/(\/|\\|{|})/g, (_, char) => "\\" + char)
		.replace(/\[/g, "{")
		.replace(/]/g, "}")
}

export function unescapeTitle(title: string) {
	return title.replace(/(\\.|{|})/g, (_, chars) =>
		chars === "{" ? "[" : chars === "}" ? "]" : chars.slice(1),
	)
}

function splitOnUnescapedForwardSlashes(str: string) {
	return str.split("/").reduceRight<string[]>((acc, prev) => {
		if (prev.endsWith("\\")) {
			return [prev + "/" + acc[0], ...acc.slice(1)]
		} else {
			return [prev, ...acc]
		}
	}, [])
}

function getShowInfo(showInfoString: string) {
	const [color, longTitle, shortTitle] =
		splitOnUnescapedForwardSlashes(showInfoString)
	assert(color)
	assert(longTitle)
	return {
		color,
		longTitle: unescapeTitle(longTitle),
		shortTitle: unescapeTitle(shortTitle || longTitle),
	}
}

function getDateAndShowingFromToken(token: string) {
	const [alpha, slot] = token.split(/(?=\d+)/)
	assert(alpha)
	assert(slot)
	return [asserted(dateLookup[alpha]), parseInt(slot)] as const
}

function getDateAndShowing(monthDataString: string) {
	return monthDataString.split(/(?=\D)/).map(getDateAndShowingFromToken)
}

function getShowingsInfo(
	showingsInfoString: string,
	details: { id: string } & StartingMonth,
) {
	const { id, startingMonth, startingYear } = details
	const months = (showingsInfoString || "").split("^")

	const performances = []
	let monthNum = startingMonth - 1
	let year = startingYear

	let i = 0
	for (const month of months) {
		i++
		monthNum = getMonthNum(monthNum + 1)
		if (i > 1 && monthNum === 1) {
			year++
		}

		if (!month) continue

		const dates = getDateAndShowing(month)
		for (const date of dates) {
			const [day, slot] = date
			performances.push({ year, month: monthNum, day, slot, id })
		}
	}
	return performances
}

function getShowInfoAndShowings(
	singleShowString: string,
	details: StartingMonth,
) {
	const [showInfoString, showingsString] = singleShowString
		.split(/\[|\]/)
		.filter(Boolean)

	assert(showInfoString, "Missing show info. Was there an opening brace?")
	assert(showingsString, "Missing show perfs. Was there a closing brace?")

	const production = getShowInfo(showInfoString)

	return {
		production,
		performances: getShowingsInfo(showingsString, {
			id: production.shortTitle,
			...details,
		}),
	}
}

// The positive lookahead consumes no characters, so the strings do not lose
// their starting bracket
const reShowStart = /(?=\[)/

export function showingsStringToData(
	str: string,
	details: StartingMonth,
): ShowingsData {
	const shows = str.split(reShowStart).filter(Boolean)
	const showsWithParts = shows.map((x) => getShowInfoAndShowings(x, details))

	return {
		productions: showsWithParts.map((x) => x.production),
		performances: showsWithParts
			.flatMap((x) => x.performances)
			.sort(sortPerformances),
	}
}

function showInfoDataToString({
	color,
	shortTitle,
	longTitle,
}: ProductionDetails): string {
	return shortTitle === longTitle
		? `[${color}/${escapeTitle(longTitle)}]`
		: `[${color}/${escapeTitle(longTitle)}/${escapeTitle(shortTitle)}]`
}

function yearMonthString(
	date: { year: number; month: number } = FALLBACK_STARTING_DATE,
) {
	return `${date?.year}-${date?.month}`
}

function monthTick(yearMonthString: string) {
	const [year, month] = yearMonthString.split("-").map(Number)
	assert(year)
	assert(month)
	const newMonth = getMonthNum(month + 1)
	const newYear = newMonth === 1 ? year + 1 : year
	return `${newYear}-${newMonth}`
}

function getStartingMonthAdvancements(
	firstPerf: PerformanceDetails | undefined,
	{ startingYear, startingMonth }: StartingMonth,
) {
	const firstDate: Pick<PerformanceDetails, "month" | "year"> = firstPerf
		? firstPerf
		: FALLBACK_STARTING_DATE
	const firstPerfMonth = `${firstDate.year}-${firstDate.month}`
	let earliestMonth = `${startingYear}-${startingMonth}`
	let result = ""

	while (
		earliestMonth !== firstPerfMonth &&
		firstDate !== FALLBACK_STARTING_DATE
	) {
		earliestMonth = monthTick(earliestMonth)
		result += "^"
		if (result.length > 12) throw new Error("Runaway starting month ticks")
	}

	return result
}

function performancesToString(
	performances: PerformanceDetails[],
	details: StartingMonth,
) {
	let result = getStartingMonthAdvancements(performances[0], details)
	let currentMonth = yearMonthString(performances[0])
	for (const performance of performances) {
		while (currentMonth !== yearMonthString(performance)) {
			result += "^"
			currentMonth = monthTick(currentMonth)
			if (result.length > 300)
				throw new Error("Runaway mid-performance month advancement")
		}

		result += asserted(alphaLookup[performance.day]) + performance.slot
	}

	return result
}

function serializeData(
	data: { production: ProductionDetails; performances: PerformanceDetails[] },
	details: StartingMonth,
) {
	const prodInfo = showInfoDataToString(data.production)
	const perfString = performancesToString(data.performances, details)

	return prodInfo + perfString
}

export function sortPerformances(
	a: PerformanceDetails,
	b: PerformanceDetails,
): number {
	if (a.year !== b.year) return a.year - b.year
	if (a.month !== b.month) return a.month - b.month
	if (a.day !== b.day) return a.day - b.day
	if (a.slot !== b.slot) return a.slot - b.slot
	return 0
}

export function showingsDataToString(data: ShowingsData): {
	scheduleString: string
	details: StartingMonth
} {
	const { productions, performances } = data

	performances.sort(sortPerformances)

	const firstPerformance: PerformanceDetails | undefined = performances[0]

	const startingDetails = {
		startingYear: firstPerformance?.year || new Date().getFullYear(),
		startingMonth: firstPerformance?.month || new Date().getMonth() + 1,
	}

	const serializableData = productions.map((p) => ({
		production: p,
		performances: performances.filter((perf) => perf.id === p.shortTitle),
	}))
	const scheduleString = serializableData
		.map((x) => serializeData(x, startingDetails))
		.join("")
	return { scheduleString, details: startingDetails }
}

export function showingsDataToQueryParamsObj(data: ShowingsData) {
	const x = showingsDataToString(data)
	return {
		start: x.details.startingYear + "-" + x.details.startingMonth,
		schedule: x.scheduleString,
	}
}
