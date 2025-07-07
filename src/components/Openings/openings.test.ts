import { describe, it, expect } from "vitest"
import { findClosingDate } from "./openings"

type Prod = Parameters<typeof findClosingDate>[1][number]

describe(findClosingDate.name, () => {
	it("finds the closing date for a single production", () => {
		const production: Prod = { dates: { fort_rob: "Aug 1e 2m 3a 10e" } }
		expect(findClosingDate(2025, [production])).toBe("2025-08-10")
	})

	it("finds the single closing date for multiple productions", () => {
		const productions: Prod[] = [
			{ dates: { fort_rob: "Aug 1e 2m 3a 10e" } },
			{ dates: { fort_rob: "Sep 1e" } },
		]
		expect(findClosingDate(2025, productions)).toBe("2025-09-01")
	})
})
