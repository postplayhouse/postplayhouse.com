import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import { describe, expect, test } from "vitest"
import { generatedNewsImageReferences } from "./postplayhouse.config"

async function files(root: string): Promise<string[]> {
	const groups = await Promise.all(
		(await readdir(root, { withFileTypes: true })).map((entry) =>
			entry.isDirectory()
				? ["src/images", "src/lib/server"].includes(join(root, entry.name))
					? []
					: files(join(root, entry.name))
				: [join(root, entry.name)],
		),
	)
	return groups.flat()
}

describe("server-only historical metadata", () => {
	test("generates deterministic, route-specific news references", async () => {
		const first = await generatedNewsImageReferences()
		const second = await generatedNewsImageReferences()
		expect(second).toBe(first)
		expect(first).toContain('"2017/young-frankenstein.jpg"')
		expect(first).toContain('"2019/raffle/post-raffle-2019_16.jpg"')
	})

	test("is not imported from browser-capable source modules", async () => {
		const offenders: string[] = []
		for (const path of await files("src")) {
			if (!/\.(?:md|svelte|ts)$/.test(path) || path.endsWith(".server.ts"))
				continue
			const source = await readFile(path, "utf8")
			if (
				source.includes("server/generated/historical-images") ||
				source.includes("historicalPeoplePictures") ||
				source.includes("historicalSeasonPictures")
			)
				offenders.push(path)
		}
		expect(offenders).toEqual([])
	}, 10_000)
})
