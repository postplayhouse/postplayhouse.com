import { describe, it, expect } from "vitest"
import { showingsDataToString, showingsStringToData } from "./showingsData"
import {
	addPerformance,
	addProduction,
	editProduction,
	removePerformanceBySlot,
	removeProduction,
} from "./changeset"

describe("performance manipulation", () => {
	const startingScheduleString = "[fff/Title]a1b2c3^a1b2c3"
	const startingDetails = { startingMonth: 12, startingYear: 2021 }
	const schedule = showingsStringToData(startingScheduleString, startingDetails)

	it("can add a performance", () => {
		const newData = addPerformance(schedule, {
			year: 2021,
			month: 12,
			day: 4,
			slot: 4,
			id: "Title",
		})

		const { scheduleString, details } = showingsDataToString(newData)

		expect(scheduleString).toEqual("[fff/Title]a1b2c3d4^a1b2c3")

		expect(details).toEqual(startingDetails)
	})

	it("if added performance exists, no change occurs", () => {
		const newData = addPerformance(schedule, {
			year: 2021,
			month: 12,
			day: 1,
			slot: 1,
			id: "Title",
		})

		const { scheduleString, details } = showingsDataToString(newData)

		expect(scheduleString).toEqual(startingScheduleString)

		expect(details).toEqual(startingDetails)
	})

	it("can remove a performance", () => {
		const newData = removePerformanceBySlot(schedule, {
			year: 2022,
			month: 1,
			day: 1,
			slot: 1,
		})

		const { scheduleString, details } = showingsDataToString(newData)

		expect(scheduleString).toEqual("[fff/Title]a1b2c3^b2c3")

		expect(details).toEqual(startingDetails)
	})

	it("it does nothing if performance to remove doesn't exist", () => {
		const newData = removePerformanceBySlot(schedule, {
			year: 2022,
			month: 2,
			day: 1,
			slot: 1,
		})

		const { scheduleString, details } = showingsDataToString(newData)

		expect(scheduleString).toEqual(startingScheduleString)

		expect(details).toEqual(startingDetails)
	})
})

describe("production manipulation", () => {
	const startingScheduleString = "[fff/Title]a1b2c3^a1b2c3"
	const startingDetails = { startingMonth: 12, startingYear: 2021 }
	const schedule = showingsStringToData(startingScheduleString, startingDetails)

	it("can add a production", () => {
		const newData = addProduction(schedule, {
			longTitle: "NewShow",
		})

		const { scheduleString, details } = showingsDataToString(newData)

		expect(scheduleString).toEqual(startingScheduleString + "[fff/NewShow]")

		expect(details).toEqual(startingDetails)
	})

	it("if added production (shortTitle) exists, no change occurs", () => {
		const newData = addProduction(schedule, {
			longTitle: "Title",
		})

		const { scheduleString, details } = showingsDataToString(newData)

		expect(newData).toEqual(schedule)

		expect(scheduleString).toEqual(startingScheduleString)

		expect(details).toEqual(startingDetails)
	})

	it("can remove a production (when it is the last One)", () => {
		const newData = removeProduction(schedule, "Title")

		const { scheduleString, details } = showingsDataToString(newData)

		expect(scheduleString).toEqual("")

		expect(details).toEqual(startingDetails)
	})

	it("can remove a production (when it is NOT the last One)", () => {
		const schedule = showingsStringToData(
			startingScheduleString + "[ccc/OtherShow]a2",
			startingDetails,
		)
		const newData = removeProduction(schedule, "Title")

		const { scheduleString, details } = showingsDataToString(newData)

		expect(scheduleString).toEqual("[ccc/OtherShow]a2")

		expect(details).toEqual(startingDetails)
	})

	it("it does nothing if production to remove doesn't exist", () => {
		const newData = removeProduction(schedule, "SkipMe")

		const { scheduleString, details } = showingsDataToString(newData)

		expect(scheduleString).toEqual(startingScheduleString)

		expect(details).toEqual(startingDetails)
	})

	describe("editing a production", () => {
		it("can change the color", () => {
			const newData = editProduction(schedule, "Title", { color: "911" })

			expect(newData.productions[0]!.color).toBe("911")
		})

		it("can change the longTitle", () => {
			const newData = editProduction(schedule, "Title", {
				longTitle: "The-Long-Title",
			})

			expect(newData.productions[0]!.longTitle).toBe("The-Long-Title")

			const { scheduleString } = showingsDataToString(newData)

			expect(
				scheduleString.startsWith("[fff/The-Long-Title/Title]"),
			).toBeTruthy()
		})

		it("can change the short title", () => {
			const newData = editProduction(schedule, "Title", {
				shortTitle: "T",
			})

			expect(newData.productions[0]!.shortTitle).toBe("T")

			const { scheduleString } = showingsDataToString(newData)

			expect(scheduleString.startsWith("[fff/Title/T]")).toBeTruthy()
		})
	})
})
