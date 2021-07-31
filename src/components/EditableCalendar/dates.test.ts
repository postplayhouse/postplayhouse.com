import { showingsStringToData } from "./showingsData"
import { makeDateIterator } from "./dates"

describe("dateIterator", () => {
  const schedule = showingsStringToData("[aaa/ShowA]C1[bbb/ShowB]^b1", {
    startingYear: 2021,
    startingMonth: 12,
  })

  const iterator = makeDateIterator(schedule)

  const allDates: Exclude<
    ReturnType<typeof iterator.next>["value"],
    void
  >[] = []

  for (const date of iterator) {
    allDates.push(date)
  }
  it("gets the number of iterations correct", () => {
    expect(allDates.length).toEqual(5)
  })

  it("gets the starting day of week correct", () => {
    expect(allDates[0].weekdayName).toEqual("Wednesday")
  })

  it("gets the first performance correct", () => {
    expect(allDates[0].performances[0].shortTitle).toEqual("ShowA")
  })

  it("has no performances on the middle days", () => {
    expect(allDates[1].performances.length).toEqual(0)
    expect(allDates[2].performances.length).toEqual(0)
    expect(allDates[3].performances.length).toEqual(0)
  })
})
