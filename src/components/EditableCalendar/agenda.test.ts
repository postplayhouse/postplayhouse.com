import { describe, it, expect } from "vitest"
import { type Agenda, createAgenda } from "./agenda"
import { showingsStringToData } from "./showingsData"

describe("showings data, merged with show info produces performance dates", () => {
	const searchString =
		"[ccc/Long-Name-Here/Short-Name]C1^a3b2d3e3f3" +
		"[fff/My-Show]C2" +
		"[990000/The-Show-Title/Title]^b3e2f2"

	const showingsData = showingsStringToData(searchString, {
		startingYear: 2021,
		startingMonth: 12,
	})

	const agenda = createAgenda(showingsData.performances)

	const expectedData: Agenda = {
		2021: {
			12: {
				29: [
					{ id: "Short-Name", slot: 1 },
					{ id: "My-Show", slot: 2 },
				],
			},
		},
		2022: {
			1: {
				1: [{ id: "Short-Name", slot: 3 }],
				2: [
					{ id: "Short-Name", slot: 2 },
					{ id: "Title", slot: 3 },
				],
				4: [{ id: "Short-Name", slot: 3 }],
				5: [
					{ id: "Title", slot: 2 },
					{ id: "Short-Name", slot: 3 },
				],
				6: [
					{ id: "Title", slot: 2 },
					{ id: "Short-Name", slot: 3 },
				],
			},
		},
	}

	it("works entirely (if this fails, other test failures will guide you)", () => {
		expect(agenda).toEqual(expectedData)
	})

	it("correctly spans two years", () => {
		expect(Object.keys(agenda).length).toEqual(2)

		expect(agenda).toMatchObject({ 2021: {}, 2022: {} })
	})

	it("correctly places shows in December and January", () => {
		expect(Object.keys(agenda[2021]!).length).toEqual(1)
		expect(agenda[2021]![12]).toBeTruthy()

		expect(Object.keys(agenda[2022]!).length).toEqual(1)
		expect(agenda[2022]![1]).toBeTruthy()
	})

	it("correctly identifies the performance dates in each month", () => {
		expect(agenda[2021]![12]![29]).toBeTruthy()
		expect(Object.keys(agenda[2021]![12]!).length).toEqual(1)

		expect(agenda[2022]![1]![1]).toBeTruthy()
		expect(agenda[2022]![1]![2]).toBeTruthy()
		expect(agenda[2022]![1]![4]).toBeTruthy()
		expect(agenda[2022]![1]![5]).toBeTruthy()
		expect(agenda[2022]![1]![6]).toBeTruthy()
		expect(Object.keys(agenda[2022]![1]!).length).toEqual(5)
	})
})
