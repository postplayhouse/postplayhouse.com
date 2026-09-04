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

export type ScheduleWarning = {
	id: string
	message: string
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

	const production = getShowInfo(showInfoString)

	return {
		production,
		performances: showingsString
			? getShowingsInfo(showingsString, {
					id: production.shortTitle,
					...details,
				})
			: [],
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

function performanceDate(performance: PerformanceDetails) {
	return new Date(performance.year, performance.month - 1, performance.day)
}

function performanceDateKey(performance: PerformanceDetails) {
	return `${performance.year}-${performance.month}-${performance.day}`
}

function dateKey(date: Date) {
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

type ScheduleCaveatContext = {
	openingsAfterDate: ReadonlyMap<string, string[]>
}

const scheduleCaveats = [
	{
		id: "independence-day",
		appliesTo: (date: Date, _context: ScheduleCaveatContext) =>
			date.getMonth() === 6 && date.getDate() === 4,
		message: (_date: Date, _context: ScheduleCaveatContext) =>
			"No performances should be scheduled on July 4.",
	},
	{
		id: "monday",
		appliesTo: (date: Date, _context: ScheduleCaveatContext) =>
			date.getDay() === 1,
		message: (date: Date, _context: ScheduleCaveatContext) =>
			`No performances should be scheduled on ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`,
	},
	{
		id: "day-before-opening",
		appliesTo: (date: Date, context: ScheduleCaveatContext) =>
			context.openingsAfterDate.has(dateKey(date)),
		message: (date: Date, context: ScheduleCaveatContext) =>
			`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} is the day before ${context.openingsAfterDate.get(dateKey(date))!.join(" and ")} opens and should have no performances.`,
	},
]

function scheduleCaveatFor(date: Date, context: ScheduleCaveatContext) {
	return scheduleCaveats.find(({ appliesTo }) => appliesTo(date, context))
}

function friendlyPerformanceDate(performance: PerformanceDetails) {
	return performanceDate(performance).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	})
}

export function scheduleWarnings(schedule: ShowingsData): ScheduleWarning[] {
	const warnings: ScheduleWarning[] = []
	const performancesBySlot = new Map<string, PerformanceDetails[]>()
	const performancesByDate = new Map<string, PerformanceDetails[]>()
	const performancesByProduction = new Map<string, PerformanceDetails[]>()

	for (const performance of schedule.performances) {
		const date = performanceDate(performance)
		const dayKey = performanceDateKey(performance)
		const slotKey = `${dayKey}-${performance.slot}`

		for (const [map, key] of [
			[performancesBySlot, slotKey],
			[performancesByDate, dayKey],
			[performancesByProduction, performance.id],
		] as const) {
			const performances = map.get(key) ?? []
			performances.push(performance)
			map.set(key, performances)
		}

		if (date.getDay() === 0 && performance.slot === 3) {
			warnings.push({
				id: `sunday-evening-${dayKey}-${performance.id}`,
				message: `${performance.id} has an 8pm performance on ${friendlyPerformanceDate(performance)}.`,
			})
		}
	}

	for (const [slotKey, performances] of performancesBySlot) {
		if (performances.length < 2) continue
		warnings.push({
			id: `duplicate-${slotKey}`,
			message: `${performances.map(({ id }) => id).join(" and ")} share the same performance slot on ${friendlyPerformanceDate(performances[0]!)}.`,
		})
	}

	const recurringProductions = [...performancesByProduction]
		.filter(([, performances]) => performances.length > 1)
		.map(([id, performances]) => [id, performances[0]!] as const)

	const openingsAfterDate = new Map<string, string[]>()
	for (const [id, opening] of recurringProductions) {
		const dayBeforeOpening = performanceDate(opening)
		dayBeforeOpening.setDate(dayBeforeOpening.getDate() - 1)
		const openingIds = openingsAfterDate.get(dateKey(dayBeforeOpening)) ?? []
		openingIds.push(id)
		openingsAfterDate.set(dateKey(dayBeforeOpening), openingIds)
	}
	const caveatContext = { openingsAfterDate }

	for (const [dayKey, performances] of performancesByDate) {
		const date = performanceDate(performances[0]!)
		const caveat = scheduleCaveatFor(date, caveatContext)
		if (!caveat) continue
		warnings.push({
			id: `caveat-${caveat.id}-${dayKey}`,
			message: caveat.message(date, caveatContext),
		})
	}

	if (recurringProductions.length === 0) return warnings

	const allShowsOpenDate = new Date(
		Math.max(
			...recurringProductions.map(([, opening]) =>
				performanceDate(opening).getTime(),
			),
		),
	)

	for (const [dayKey, performances] of performancesByDate) {
		const date = performanceDate(performances[0]!)
		const weekday = date.getDay()
		const productionCount = new Set(performances.map(({ id }) => id)).size

		if (date < allShowsOpenDate && performances.length > 1) {
			warnings.push({
				id: `multiple-before-open-${dayKey}`,
				message: `${friendlyPerformanceDate(performances[0]!)} has ${performances.length} performances before every show has opened.`,
			})
		}

		if ([0, 2, 4].includes(weekday) && productionCount > 1) {
			warnings.push({
				id: `multiple-shows-${dayKey}`,
				message: `${friendlyPerformanceDate(performances[0]!)} has multiple shows; Tuesdays, Thursdays, and Sundays should have only one.`,
			})
		}
	}

	const finalPerformanceDate = new Date(
		Math.max(
			...schedule.performances.map((performance) =>
				performanceDate(performance).getTime(),
			),
		),
	)
	const firstPerformanceDate = new Date(
		Math.min(
			...schedule.performances.map((performance) =>
				performanceDate(performance).getTime(),
			),
		),
	)
	for (
		const date = new Date(firstPerformanceDate);
		date <= finalPerformanceDate;
		date.setDate(date.getDate() + 1)
	) {
		if (scheduleCaveatFor(date, caveatContext)) continue
		if (performancesByDate.has(dateKey(date))) continue
		warnings.push({
			id: `missing-performance-${dateKey(date)}`,
			message: `No performance is scheduled on ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`,
		})
	}

	for (
		const date = new Date(allShowsOpenDate);
		date <= finalPerformanceDate;
		date.setDate(date.getDate() + 1)
	) {
		const weekday = date.getDay()
		if (weekday < 2 || weekday > 6 || scheduleCaveatFor(date, caveatContext))
			continue
		const performances = performancesByDate.get(dateKey(date)) ?? []
		if (performances.some(({ slot }) => slot === 3)) continue
		warnings.push({
			id: `missing-evening-${dateKey(date)}`,
			message: `No 8pm performance is scheduled on ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`,
		})
	}

	return warnings
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
