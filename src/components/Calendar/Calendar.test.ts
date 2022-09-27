// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom"
import { render } from "@testing-library/svelte"
import Calendar from "./Calendar.svelte"
import data from "$data/_yaml"

describe("<Calendar>", () => {
  test("shows proper date details", () => {
    const { container } = render(Calendar, {
      productions: data.productions[2020],
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
