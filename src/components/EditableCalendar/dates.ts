import { asserted } from "$helpers"
import { add } from "date-fns"
import { createAgenda } from "./agenda"
import type { PerformanceDetails, ShowingsData } from "./showingsData"

export function dateOfPerformance(performance: PerformanceDetails): Date {
	return new Date(performance.year, performance.month - 1, performance.day)
}

export function getDateDetails(date: Date) {
	return {
		month: date.getMonth() + 1,
		day: date.getDate(),
		year: date.getFullYear(),
		weekday: date.getDay() + 1,
	}
}

const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const

const shortMonths = [
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

const weekdayNames = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
]
const weekdayShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function extendDateDetails(details: ReturnType<typeof getDateDetails>) {
	return {
		...details,
		weekdayName: weekdayNames[details.weekday - 1],
		weekdayShortName: weekdayShortNames[details.weekday - 1],
		monthName: months[details.month - 1],
		monthShortName: shortMonths[details.month - 1],
	}
}

export function* makeDateIterator(schedule: ShowingsData) {
	let currentDate = dateOfPerformance(asserted(schedule.performances.at(0)))
	const finalDate = dateOfPerformance(asserted(schedule.performances.at(-1)))
	const agenda = createAgenda(schedule.performances)

	while (currentDate <= finalDate) {
		const dateDetails = extendDateDetails(getDateDetails(currentDate))
		const performances = (
			agenda?.[dateDetails.year]?.[dateDetails.month]?.[dateDetails.day] ?? []
		).map((perf) => ({
			...asserted(
				schedule.productions.find((prod) => perf.id === prod.shortTitle),
				`no production found with shortTitle ${perf.id}`,
			),
			slot: perf.slot,
		}))
		yield { ...dateDetails, performances }
		currentDate = add(currentDate, { days: 1 })
	}

	return
}
