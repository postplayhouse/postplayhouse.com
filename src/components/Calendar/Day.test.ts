// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom"
import { render } from "@testing-library/svelte"
import { TWO_PM, EIGHT_PM } from "./calendarHelpers"
import Day from "./Day.svelte"

const MONDAY = { year: 2021, month: 5, day: 31 }
const FRIDAY = { year: 2021, month: 6, day: 4 }

// For now, venue is not used, but still included
const SHOW_1 = {
  msFromMidnight: TWO_PM,
  color: "red",
  title: "Annie",
  venue: "fort_rob",
}
const SHOW_2 = {
  msFromMidnight: EIGHT_PM,
  color: "blue",
  title: "Guys & Dolls",
  venue: "fort_rob",
}

describe("<Day>", () => {
  test("shows proper date details", () => {
    const { getByText, container } = render(Day, {
      date: FRIDAY,
      daySchedule: [SHOW_1],
    })

    expect(getByText("Friday")).toBeInTheDocument()
    expect(getByText("Jun")).toBeInTheDocument()
    expect(getByText("4")).toBeInTheDocument()

    expect(container.querySelector(".friday")).toBeInTheDocument()
    expect(container.querySelector(".jun")).toBeInTheDocument()
  })

  describe("Dark days", () => {
    test("expectd output", () => {
      const { container } = render(Day, { date: MONDAY })

      expect(container.querySelector(".dark")).toBeInTheDocument()
      expect(container.querySelector(".show-count-0")).toBeInTheDocument()
    })
  })

  describe("Showings", () => {
    test("single show, 2pm", () => {
      const { container, getByText } = render(Day, {
        date: FRIDAY,
        daySchedule: [SHOW_1],
      })

      expect(container.querySelector(".show-count-1")).toBeInTheDocument()
      expect(container.querySelector(".show-red")).toBeInTheDocument()
      expect(getByText("2p")).toBeInTheDocument()
      expect(getByText("Annie")).toBeInTheDocument()

      expect(container.querySelector(".spacer")).not.toBeInTheDocument()
    })

    test("single show, 8pm", () => {
      const { container, getByText } = render(Day, {
        date: FRIDAY,
        daySchedule: [SHOW_2],
      })

      expect(container.querySelector(".show-count-1")).toBeInTheDocument()
      expect(container.querySelector(".show-blue")).toBeInTheDocument()
      expect(getByText("8p")).toBeInTheDocument()
      expect(getByText("Guys & Dolls")).toBeInTheDocument()

      expect(container.querySelector(".spacer")).toBeInTheDocument()
    })

    test("two shows, different id, 2 and 8", () => {
      const { container, getByText } = render(Day, {
        date: FRIDAY,
        daySchedule: [SHOW_1, SHOW_2],
      })

      // existance
      expect(container.querySelector(".show-count-2")).toBeInTheDocument()
      expect(container.querySelector(".show-red")).toBeInTheDocument()
      expect(container.querySelector(".show-blue")).toBeInTheDocument()
      expect(getByText("2p")).toBeInTheDocument()
      expect(getByText("8p")).toBeInTheDocument()
      expect(getByText("Annie")).toBeInTheDocument()
      expect(getByText("Guys & Dolls")).toBeInTheDocument()

      // ordering
      const [show1, show2] = container.querySelectorAll(".showing")
      expect(show1).toHaveClass("show-red")
      expect(show2).toHaveClass("show-blue")
    })
  })
})
