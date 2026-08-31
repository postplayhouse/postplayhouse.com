// @vitest-environment node
import { readFile } from "node:fs/promises"
import { expect, it } from "vitest"
import { CURRENT_SEASON } from "./config"
import { discoverHistoricalSources } from "./discover"

it("matches the exact historical production image graph", async () => {
	expect(await readFile("src/data/seasons.ts", "utf8")).toContain(
		`season = ${CURRENT_SEASON}`,
	)
	const sources = await discoverHistoricalSources()
	expect(new Set(sources.map(({ path }) => path))).toHaveLength(650)
	expect(sources).toHaveLength(652)
	expect(sources.some(({ path }) => path.endsWith(".JPG"))).toBe(false)
	expect(sources.some(({ path }) => path.includes("/2027/"))).toBe(false)
	expect(
		sources.filter(({ profile }) => profile === "raffle-default-1x-2x"),
	).toHaveLength(2)
})
