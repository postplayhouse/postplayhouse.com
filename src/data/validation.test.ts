import { describe, expect, it } from "vitest"

import { yearStringToNumber } from "./validation"

// This is totally testing the framework, but helps me know how it is supposed
// to work
describe("yearStringToNumber", () => {
	it("should fail if the string input is not a valid year", () => {
		expect(() => yearStringToNumber.parse("1776")).toThrow()
		expect(() => yearStringToNumber.parse("177")).toThrow()
		expect(() => yearStringToNumber.parse(undefined)).toThrow()
		expect(() => yearStringToNumber.parse("2030")).toThrow()
	})

	it("should fail decode and encode with bad input", () => {
		// @ts-expect-error
		expect(() => yearStringToNumber.decode("1776")).toThrow()
		// @ts-expect-error
		expect(() => yearStringToNumber.encode(2030)).toThrow()
	})

	it("should convert the values to ints", () => {
		expect(yearStringToNumber.parse("2025")).toEqual(2025)
	})
})
