import { describe, expect, test } from "vitest"
import { approvedHistoricalHeadshot } from "./bio-headshots"

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

	test.each(["../2026/jo-arnold.jpg", "2026/missing.jpg", "jo-arnold.jpg"])(
		"rejects unapproved identifier %s",
		async (id) => expect(await approvedHistoricalHeadshot(id)).toBeUndefined(),
	)
})
