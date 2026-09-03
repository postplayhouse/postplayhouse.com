import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"
import {
	approvedHeadshotIds,
	approvedHistoricalHeadshot,
	clearApprovedHeadshotCache,
} from "./bio-headshots"

const temporary: string[] = []

afterEach(async () => {
	clearApprovedHeadshotCache()
	for (const path of temporary.splice(0))
		await rm(path, { recursive: true, force: true })
})

describe("approved historical bio headshots", () => {
	test("returns only one approved picture", async () => {
		const record = await approvedHistoricalHeadshot("2026/jo-arnold.jpg")
		expect(record?.id).toBe("2026/jo-arnold.jpg")
		expect(record?.picture.sources).toEqual({
			avif: "/_app/immutable/assets/jo-arnold.B64bAtGj.avif 400w, /_app/immutable/assets/jo-arnold.RU8Vb0L4.avif 800w",
			webp: "/_app/immutable/assets/jo-arnold.qd8vFYq1.webp 400w, /_app/immutable/assets/jo-arnold.DUN67QxW.webp 800w",
			jpeg: "/_app/immutable/assets/jo-arnold.Cdd2U4sI.jpg 400w, /_app/immutable/assets/jo-arnold.0V-O-8LM.jpg 800w",
		})
		expect(Object.keys(record ?? {})).toEqual(["id", "picture"])
	})

	test.each([
		"../2026/jo-arnold.jpg",
		"2026/../jo-arnold.jpg",
		"%2e%2e/2026/jo-arnold.jpg",
		"2026/JO-ARNOLD.JPG",
		"2027/current.jpg",
		"2026/missing.jpg",
		"jo-arnold.jpg",
	])("rejects unapproved identifier %s", async (id) =>
		expect(await approvedHistoricalHeadshot(id)).toBeUndefined(),
	)

	test("enumerates an approval root at most once per server process", async () => {
		const root = await mkdtemp(join(tmpdir(), "headshot-approvals-"))
		temporary.push(root)
		await mkdir(join(root, "2026"))
		await writeFile(join(root, "2026/person.jpg"), "one")
		expect(await approvedHeadshotIds(root)).toEqual(["2026/person.jpg"])
		await writeFile(join(root, "2026/late.jpg"), "two")
		expect(await approvedHeadshotIds(root)).toEqual(["2026/person.jpg"])
	})
})
