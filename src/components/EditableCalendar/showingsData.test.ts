import { describe, it, expect } from "vitest"
import { objectKeys } from "$helpers"
import {
	showingsStringToData,
	showingsDataToString,
	escapeTitle,
	scheduleWarnings,
	unescapeTitle,
} from "./showingsData"
import type { ShowingsData } from "./showingsData"

describe("showings data from and back to string", () => {
	const searchString =
		"[ccc/Long-Name-Here/Short-Name]C1^a3b2d3e3f3" +
		"[990000/The-Show-Title/Title]^b3e2f2" +
		"[fff/My-Show]C2"

	const expected: ShowingsData = {
		productions: [
			{
				color: "ccc",
				shortTitle: "Short-Name",
				longTitle: "Long-Name-Here",
			},

			{
				color: "990000",
				shortTitle: "Title",
				longTitle: "The-Show-Title",
			},
			{
				color: "fff",
				shortTitle: "My-Show",
				longTitle: "My-Show",
			},
		],
		performances: [
			{ year: 2021, month: 12, day: 29, slot: 1, id: "Short-Name" },
			{ year: 2021, month: 12, day: 29, slot: 2, id: "My-Show" },
			{ year: 2022, month: 1, day: 1, slot: 3, id: "Short-Name" },
			{ year: 2022, month: 1, day: 2, slot: 2, id: "Short-Name" },
			{ year: 2022, month: 1, day: 2, slot: 3, id: "Title" },
			{ year: 2022, month: 1, day: 4, slot: 3, id: "Short-Name" },
			{ year: 2022, month: 1, day: 5, slot: 2, id: "Title" },
			{ year: 2022, month: 1, day: 5, slot: 3, id: "Short-Name" },
			{ year: 2022, month: 1, day: 6, slot: 2, id: "Title" },
			{ year: 2022, month: 1, day: 6, slot: 3, id: "Short-Name" },
		],
	}

	const { productions, performances } = showingsStringToData(searchString, {
		startingYear: 2021,
		startingMonth: 12,
	})

	it("identifies the separate shows", () => {
		expect(productions.length).toBe(3)
	})

	it("identifies the colors", () => {
		const colors = (x: ShowingsData["productions"][number]) => x.color
		expect(productions.map(colors)).toEqual(expected.productions.map(colors))
	})

	it("identifies the Short Title", () => {
		const shortTitle = (x: ShowingsData["productions"][number]) => x.shortTitle
		expect(productions.map(shortTitle)).toEqual(
			expected.productions.map(shortTitle),
		)
	})

	it("identifies the Long Title", () => {
		const longTitle = (x: ShowingsData["productions"][number]) => x.longTitle
		expect(productions.map(longTitle)).toEqual(
			expected.productions.map(longTitle),
		)
	})

	it("gets the number of performances correct", () => {
		expect(performances.length).toEqual(10)
	})

	it("gets the data for each performance correct", () => {
		expected.performances.forEach((exPerf) => {
			expect(
				performances.find(
					(x) =>
						!objectKeys(exPerf).reduce(
							(acc, key) => acc || exPerf[key] !== x[key],
							false,
						),
				),
			).toEqual(exPerf)
		})
	})

	it("gets the performances completely correct (only failing here probably means ordering is incorrect)", () => {
		expect(performances).toEqual(expected.performances)
	})

	it("serializes the data again correctly", () => {
		expect(showingsDataToString({ performances, productions })).toEqual({
			scheduleString: searchString,
			details: { startingMonth: 12, startingYear: 2021 },
		})
	})
})

describe("edge cases", () => {
	const unimportantDetails = {
		startingMonth: 1,
		startingYear: 2000,
	}
	it("allows for a production without performances", () => {
		const startingScheduleString = "[fff/SomeShow]"
		const schedule = showingsStringToData(
			startingScheduleString,
			unimportantDetails,
		)

		expect(schedule.productions.length).toBe(1)
		expect(schedule.performances.length).toBe(0)

		const { scheduleString } = showingsDataToString(schedule)
		expect(scheduleString).toEqual(startingScheduleString)
	})

	it("handles titles with the identifiers used in the show data system", () => {
		const scheduleString = "[fff/Math^letes:+the+musical]a1b2c3^a2c2"

		const toData = showingsStringToData(scheduleString, unimportantDetails)
		expect(showingsDataToString(toData).scheduleString).toEqual(scheduleString)
	})

	it("handles forward slashes in the show titles", () => {
		const scheduleString =
			"[fff/You win some you lose some/Win\\/Lose]a1b2c3^a2c2"

		const toData = showingsStringToData(scheduleString, unimportantDetails)

		expect(toData.productions[0]!.shortTitle).toEqual("Win/Lose")

		expect(showingsDataToString(toData).scheduleString).toEqual(scheduleString)
	})

	it("handles brackets in the show titles", () => {
		const scheduleString = "[fff/{Title of Show}]a1b2c3^a2c2"

		const toData = showingsStringToData(scheduleString, unimportantDetails)

		expect(toData.productions[0]!.shortTitle).toEqual("[Title of Show]")

		expect(showingsDataToString(toData).scheduleString).toEqual(scheduleString)
	})
})

it("handles title escaping", () => {
	const forward = "Win/Lose"
	const forwardEsc = "Win\\/Lose"
	const bracket = "[title of show]"
	const bracketEsc = "{title of show}"
	const curly = "{title of code}"
	const curlyEsc = "\\{title of code\\}"
	const backslash = "Computer\\town"
	const backslashEsc = "Computer\\\\town"

	const everything = "Win/Some\\Lose\\{others}[some/]"
	const everythingEsc = "Win\\/Some\\\\Lose\\\\\\{others\\}{some\\/}"

	expect(escapeTitle(forward)).toEqual(forwardEsc)
	expect(unescapeTitle(forwardEsc)).toEqual(forward)

	expect(escapeTitle(bracket)).toEqual(bracketEsc)
	expect(unescapeTitle(bracketEsc)).toEqual(bracket)

	expect(escapeTitle(backslash)).toEqual(backslashEsc)
	expect(unescapeTitle(backslashEsc)).toEqual(backslash)

	expect(escapeTitle(everything)).toEqual(everythingEsc)
	expect(unescapeTitle(everythingEsc)).toEqual(everything)

	expect(escapeTitle(curly)).toEqual(curlyEsc)
	expect(unescapeTitle(curlyEsc)).toEqual(curly)
})

describe(scheduleWarnings.name, () => {
	it("allows the expected weekend and weekday time slots", () => {
		expect(
			scheduleWarnings({
				productions: [],
				performances: [
					{ id: "Show", year: 2027, month: 6, day: 5, slot: 3 },
					{ id: "Show", year: 2027, month: 6, day: 6, slot: 2 },
					{ id: "Show", year: 2027, month: 6, day: 8, slot: 3 },
				],
			}),
		).toEqual([])
	})

	it("flags Mondays, Sunday evenings, and duplicate time slots", () => {
		const warnings = scheduleWarnings({
			productions: [],
			performances: [
				{ id: "Monday Show", year: 2027, month: 6, day: 7, slot: 2 },
				{ id: "Sunday Show", year: 2027, month: 6, day: 6, slot: 3 },
				{ id: "First Show", year: 2027, month: 6, day: 8, slot: 3 },
				{ id: "Second Show", year: 2027, month: 6, day: 8, slot: 3 },
			],
		})

		expect(warnings.map(({ id }) => id).sort()).toEqual([
			"caveat-monday-2027-6-7",
			"duplicate-2027-6-8-3",
			"sunday-evening-2027-6-6-Sunday Show",
		])
	})

	it("flags multiple performances before every recurring show has opened", () => {
		const warnings = scheduleWarnings({
			productions: [],
			performances: [
				{ id: "First", year: 2027, month: 6, day: 4, slot: 3 },
				{ id: "First", year: 2027, month: 6, day: 5, slot: 1 },
				{ id: "First", year: 2027, month: 6, day: 5, slot: 2 },
				{ id: "Second", year: 2027, month: 6, day: 11, slot: 3 },
				{ id: "Second", year: 2027, month: 6, day: 12, slot: 3 },
			],
		})

		expect(warnings.map(({ id }) => id)).toContain(
			"multiple-before-open-2027-6-5",
		)
	})

	it.each([
		[6, "Sunday"],
		[8, "Tuesday"],
		[10, "Thursday"],
	])("flags multiple shows on %s (%s)", (day) => {
		const warnings = scheduleWarnings({
			productions: [],
			performances: [
				{ id: "Main", year: 2027, month: 6, day: 4, slot: 3 },
				{ id: "Main", year: 2027, month: 6, day: 5, slot: 3 },
				{ id: "Main", year: 2027, month: 6, day, slot: 3 },
				{ id: "Other", year: 2027, month: 6, day, slot: 2 },
			],
		})

		expect(warnings.map(({ id }) => id)).toContain(
			`multiple-shows-2027-6-${day}`,
		)
	})

	it("flags missing Tuesday through Saturday evening performances after every show has opened", () => {
		const warnings = scheduleWarnings({
			productions: [],
			performances: [
				{ id: "Show", year: 2027, month: 6, day: 4, slot: 3 },
				{ id: "Show", year: 2027, month: 6, day: 5, slot: 3 },
				{ id: "Show", year: 2027, month: 6, day: 8, slot: 2 },
			],
		})

		expect(warnings.map(({ id }) => id)).toContain("missing-evening-2027-6-8")
	})

	it("flags any day without a performance during the season", () => {
		const warnings = scheduleWarnings({
			productions: [],
			performances: [
				{ id: "Show", year: 2027, month: 6, day: 8, slot: 3 },
				{ id: "Show", year: 2027, month: 6, day: 10, slot: 3 },
			],
		})

		expect(warnings.map(({ id }) => id)).toContain(
			"missing-performance-2027-6-9",
		)
	})

	it("allows no performance on July 4 and flags one scheduled then", () => {
		const schedule = {
			productions: [],
			performances: [
				{ id: "Show", year: 2027, month: 7, day: 2, slot: 3 },
				{ id: "Show", year: 2027, month: 7, day: 3, slot: 3 },
				{ id: "Show", year: 2027, month: 7, day: 6, slot: 3 },
			],
		}

		expect(scheduleWarnings(schedule)).toEqual([])
		expect(
			scheduleWarnings({
				...schedule,
				performances: [
					...schedule.performances,
					{ id: "Show", year: 2027, month: 7, day: 4, slot: 2 },
				],
			}).map(({ id }) => id),
		).toContain("caveat-independence-day-2027-7-4")
	})

	it("allows no performance on the day before a recurring show opens", () => {
		expect(
			scheduleWarnings({
				productions: [],
				performances: [
					{ id: "First", year: 2027, month: 6, day: 1, slot: 3 },
					{ id: "First", year: 2027, month: 6, day: 2, slot: 3 },
					{ id: "Opening Show", year: 2027, month: 6, day: 4, slot: 3 },
					{ id: "Opening Show", year: 2027, month: 6, day: 5, slot: 3 },
				],
			}),
		).toEqual([])
	})

	it("flags a performance on the day before a show opens", () => {
		const warnings = scheduleWarnings({
			productions: [],
			performances: [
				{ id: "Other", year: 2027, month: 6, day: 3, slot: 3 },
				{ id: "Opening Show", year: 2027, month: 6, day: 4, slot: 3 },
				{ id: "Opening Show", year: 2027, month: 6, day: 5, slot: 3 },
			],
		})

		expect(warnings.map(({ id }) => id)).toContain(
			"caveat-day-before-opening-2027-6-3",
		)
	})
})
