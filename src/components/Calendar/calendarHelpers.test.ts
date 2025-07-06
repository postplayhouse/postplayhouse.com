import { describe, test, expect } from "vitest"
import {
	dslToData,
	timeStrToMs,
	combineShows,
	TEN_AM,
	TWO_PM,
	SEVEN_THIRTY_PM,
	EIGHT_PM,
} from "./calendarHelpers"

describe("<time>ToMs", () => {
	test("they convert durations properly", () => {
		const midnight = new Date("2020-01-01T00:00:00").valueOf()
		const tenAm = new Date("2020-01-01T10:00:00").valueOf() - midnight
		const sevenThirtyPm = new Date("2020-01-01T19:30:00").valueOf() - midnight

		expect(timeStrToMs("10:00")).toEqual(tenAm)
		expect(timeStrToMs("19:30")).toEqual(sevenThirtyPm)
	})
})

describe("dslToData", () => {
	const givens = {
		year: 2020,
		title: "Annie",
		color: "red",
		venue: "fort_rob",
		legend: {
			a: TWO_PM,
			m: TEN_AM,
			e: EIGHT_PM,
		},
	}

	test("it works with nothing", () => {
		const dslString = ``
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it adds a performance", () => {
		const dslString = `June 1a`
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: { 1: [{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" }] },
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it adds a performance of a given show", () => {
		const dslString = `June 1a`
		expect(dslToData({ ...givens, color: "blue" }, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [{ msFromMidnight: TWO_PM, color: "blue", venue: "fort_rob" }],
				},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it adds a multiple performances in a month", () => {
		const dslString = `June 1a 2a 3a`
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" }],
					2: [{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" }],
					3: [{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" }],
				},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it adds a multiple performances in a day", () => {
		const dslString = `June 1a 1a 1a`
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
					],
				},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it works with multiple times", () => {
		const dslString = `June 1a 2m 3e`
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" }],
					2: [{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" }],
					3: [{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" }],
				},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it sorts multiple times", () => {
		const dslString = `June 1e 1m 1a`
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it works with multiple times in a single day", () => {
		const dslString = `June 1m 1a 1e`
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it works with the passed default time", () => {
		const dslString = `June 1m 1a 1 2 3`
		const mutableGiven = JSON.parse(JSON.stringify(givens))
		mutableGiven.legend.default = SEVEN_THIRTY_PM // 7:00
		expect(dslToData(mutableGiven, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{
							msFromMidnight: SEVEN_THIRTY_PM,
							color: "red",
							venue: "fort_rob",
						},
					],
					2: [
						{
							msFromMidnight: SEVEN_THIRTY_PM,
							color: "red",
							venue: "fort_rob",
						},
					],
					3: [
						{
							msFromMidnight: SEVEN_THIRTY_PM,
							color: "red",
							venue: "fort_rob",
						},
					],
				},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it works with the underlying default time (8pm)", () => {
		const dslString = `June 1m 1a 1 2 3`
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
					2: [{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" }],
					3: [{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" }],
				},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it works with multiple months", () => {
		const dslString = `June 1m 1a 1e
      July 4a 4e
      August 23e
    `
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				7: {
					4: [
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				8: {
					23: [{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" }],
				},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it works with commas and/or spaces", () => {
		const dslString = `June 1m,1a,1e
      July 4a, 4e
      August 23e,
    `
		expect(dslToData(givens, dslString)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				7: {
					4: [
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				8: {
					23: [{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" }],
				},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})
})

describe("combineShows", () => {
	test("it combines two separate shows in different years", () => {
		const givens1 = {
			year: 2020,
			venue: "fort_rob",
			title: "Annie",
			color: "red",
			legend: {
				a: TWO_PM,
				m: TEN_AM,
				e: EIGHT_PM,
			},
		}

		const givens2 = {
			year: 2019,
			color: "red",
			title: "Music Man",
			venue: "fort_rob",
			legend: {
				a: TWO_PM,
				m: TEN_AM,
				e: EIGHT_PM,
			},
		}

		const schedule1 = dslToData(
			givens1,
			`
    June 1m 1a 1e
    July 4a 4e
    August 23e
  `,
		)
		const schedule2 = dslToData(
			givens2,
			`
    June 1m 1a 1e
    July 4a 4e
    August 23e
  `,
		)

		expect(combineShows(schedule1, schedule2)).toEqual({
			2019: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				7: {
					4: [
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				8: {
					23: [{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" }],
				},
				9: {},
				10: {},
				11: {},
				12: {},
			},
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				7: {
					4: [
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				8: {
					23: [{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" }],
				},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})

	test("it combines two separate shows in the same year years", () => {
		const givens1 = {
			year: 2020,
			color: "red",
			title: "Annie",
			venue: "fort_rob",
			legend: {
				a: TWO_PM,
				m: TEN_AM,
				e: EIGHT_PM,
			},
		}

		const givens2 = {
			year: 2020,
			color: "blue",
			title: "Catch Me If You Can",
			venue: "fort_rob",
			legend: {
				a: TWO_PM,
				m: TEN_AM,
				e: EIGHT_PM,
			},
		}

		const schedule1 = dslToData(
			givens1,
			`
    June 1m 1e
    July 4a 
    August 23a
  `,
		)
		const schedule2 = dslToData(
			givens2,
			`
    June 1a
    August 23e
  `,
		)

		expect(combineShows(schedule1, schedule2)).toEqual({
			2020: {
				1: {},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {
					1: [
						{ msFromMidnight: TEN_AM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: TWO_PM, color: "blue", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "red", venue: "fort_rob" },
					],
				},
				7: {
					4: [{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" }],
				},
				8: {
					23: [
						{ msFromMidnight: TWO_PM, color: "red", venue: "fort_rob" },
						{ msFromMidnight: EIGHT_PM, color: "blue", venue: "fort_rob" },
					],
				},
				9: {},
				10: {},
				11: {},
				12: {},
			},
		})
	})
})
