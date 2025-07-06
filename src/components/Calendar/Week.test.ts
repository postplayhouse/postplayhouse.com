import { describe, test, expect } from "vitest"
import { render } from "@testing-library/svelte"
import {
	TWO_PM,
	EIGHT_PM,
	TEN_AM,
	type SimpleDate,
	type Showing,
} from "./calendarHelpers"
import Week from "./Week.svelte"

const SUNDAY: SimpleDate = { year: 2021, month: 5, day: 30 }
const MONDAY: SimpleDate = { year: 2021, month: 5, day: 31 }
const TUESDAY: SimpleDate = { year: 2021, month: 6, day: 1 }
const WEDNESDAY: SimpleDate = { year: 2021, month: 6, day: 2 }
const THURSDAY: SimpleDate = { year: 2021, month: 6, day: 3 }
const FRIDAY: SimpleDate = { year: 2021, month: 6, day: 4 }
const SATURDAY: SimpleDate = { year: 2021, month: 6, day: 5 }

// For now, venue is not used, but still included
const annie = (ms: number): Showing => ({
	msFromMidnight: ms,
	color: "red",
	title: "Annie",
	venue: "fort_rob",
})
const guys = (ms: number): Showing => ({
	msFromMidnight: ms,
	color: "blue",
	title: "Guys & Dolls",
	venue: "fort_rob",
})

describe("<Week>", () => {
	test("shows proper date details", () => {
		const { getByText, container } = render(Week, {
			days: [
				{ date: SUNDAY, showings: [annie(TWO_PM)] },
				{ date: MONDAY, showings: [] },
				{ date: TUESDAY, showings: [guys(EIGHT_PM)] },
				{ date: WEDNESDAY, showings: [annie(TWO_PM), guys(EIGHT_PM)] },
				{ date: THURSDAY, showings: [guys(TWO_PM), annie(EIGHT_PM)] },
				{ date: FRIDAY, showings: [guys(EIGHT_PM)] },
				{
					date: SATURDAY,
					showings: [annie(TEN_AM), guys(TWO_PM), annie(EIGHT_PM)],
				},
			],
		})

		expect(container.querySelectorAll(".week > li")).toHaveLength(7)

		expect(getByText("Sunday")).toBeInTheDocument()
		expect(getByText("30")).toBeInTheDocument()

		expect(getByText("Monday")).toBeInTheDocument()
		expect(getByText("31")).toBeInTheDocument()

		expect(getByText("Tuesday")).toBeInTheDocument()
		expect(getByText("1")).toBeInTheDocument()

		expect(getByText("Wednesday")).toBeInTheDocument()
		expect(getByText("2")).toBeInTheDocument()

		expect(getByText("Thursday")).toBeInTheDocument()
		expect(getByText("3")).toBeInTheDocument()

		expect(getByText("Friday")).toBeInTheDocument()
		expect(getByText("4")).toBeInTheDocument()

		expect(getByText("Saturday")).toBeInTheDocument()
		expect(getByText("5")).toBeInTheDocument()
	})

	describe("padding on starting dark days", () => {
		test("it can pad the begining of a week", () => {
			const { container } = render(Week, {
				padStartCount: 5,
				days: [
					{ date: FRIDAY, showings: [guys(EIGHT_PM)] },
					{
						date: SATURDAY,
						showings: [annie(TEN_AM), guys(TWO_PM), annie(EIGHT_PM)],
					},
				],
			})

			const listItems = container.querySelectorAll(".week > li")

			expect(listItems[0]).toHaveClass("padding")
		})
	})
})
