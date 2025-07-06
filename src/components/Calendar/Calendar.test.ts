import { describe, test, expect } from "vitest"
import { render } from "@testing-library/svelte"
import Calendar from "./Calendar.svelte"
import data from "../../data/_yaml"
import { asserted } from "$helpers"

describe("<Calendar>", () => {
	test("shows proper date details", () => {
		const { container } = render(Calendar, {
			productions: asserted(data.productions[2020]) as Production[],
			year: 2020,
		})

		expect(
			container.querySelector(".day-28.thursday .may"),
		).not.toBeInTheDocument()
		expect(container.querySelector(".day-29.friday .may")).toBeInTheDocument()

		expect(
			container.querySelector(".day-17.monday .aug"),
		).not.toBeInTheDocument()
		expect(container.querySelector(".day-16.sunday .aug")).toBeInTheDocument()

		// Allows styling of individual month names per year
		expect(container.querySelector(".calendar-2020")).toBeInTheDocument()
	})
})
