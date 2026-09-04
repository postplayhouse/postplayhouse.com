import { describe, expect, it } from "vitest"
import { allYears, entries, season } from "$data/seasons"
import { match } from "../../../params/currentSeason"
import { prerender as inheritedPrerender } from "../../+layout"
import { prerender as programBiosPrerender } from "../program-bios/+page"
import { prerender as currentSeasonPrerender } from "./[year=currentSeason]/+page"

describe("biography prerender boundaries", () => {
	it("keeps current biography routes out of prerendering", () => {
		expect(currentSeasonPrerender).toBe(false)
		expect(programBiosPrerender).toBe(false)
		expect(entries).not.toContain(`/who/${season}`)
	})

	it("routes only the current season through the SSR matcher", () => {
		expect(match(String(season))).toBe(true)
		expect(match(String(season - 1))).toBe(false)
	})

	it("keeps supported historical biography routes prerendered", () => {
		expect(inheritedPrerender).toBe(true)
		for (const year of allYears.filter((year) => year !== season)) {
			expect(entries).toContain(`/who/${year}`)
		}
	})
})
