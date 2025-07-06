import { describe, beforeEach, afterEach, test, expect, vi } from "vitest"
import { dateIsBetween } from "./index"

describe(dateIsBetween.name, () => {
	test("less than is false", () => {
		expect(dateIsBetween("12/01/1983", "12/03/1983", "11/11/1983")).toBeFalsy()
	})
	test("greater than is false", () => {
		expect(dateIsBetween("12/01/1983", "12/03/1983", "12/04/1983")).toBeFalsy()
	})
	test("matching start is true", () => {
		expect(dateIsBetween("12/01/1983", "12/03/1983", "12/01/1983")).toBeTruthy()
	})
	test("matching end is true", () => {
		expect(dateIsBetween("12/01/1983", "12/03/1983", "12/03/1983")).toBeTruthy()
	})
	test("between is true", () => {
		expect(dateIsBetween("12/01/1983", "12/03/1983", "12/02/1983")).toBeTruthy()
	})

	describe("checking the current date", () => {
		beforeEach(() => {
			vi.useFakeTimers()
		})
		afterEach(() => {
			vi.useRealTimers()
		})

		test("less than is false", () => {
			vi.setSystemTime(new Date("11/11/1983"))
			expect(dateIsBetween("12/01/1983", "12/03/1983")).toBeFalsy()
		})
		test("greater than is false", () => {
			vi.setSystemTime(new Date("12/04/1983"))
			expect(dateIsBetween("12/01/1983", "12/03/1983")).toBeFalsy()
		})
		test("between is true", () => {
			vi.setSystemTime(new Date("12/01/1983"))
			expect(dateIsBetween("12/01/1983", "12/03/1983")).toBeTruthy()
		})
	})
})
