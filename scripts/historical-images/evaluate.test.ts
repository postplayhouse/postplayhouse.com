// @vitest-environment node
import { expect, it } from "vitest"
import { compare } from "./evaluate"

const file = (path: string, sha256: string) => ({ path, sha256, bytes: 1 })

it("reports candidate-only and baseline-only assets and people", () => {
	const baseline = {
		assets: [file("kept.jpg", "a"), file("missing.jpg", "b")],
		people: [file("person.jpg", "c")],
		pictures: [{ page: "/", sources: [] }],
	}
	const candidate = {
		assets: [file("kept.jpg", "a"), file("unexpected.jpg", "d")],
		people: [file("person.jpg", "changed"), file("extra.jpg", "e")],
		pictures: baseline.pictures,
	}
	expect(compare(baseline as never, candidate as never)).toEqual({
		missingOrChangedAssets: ["missing.jpg"],
		extraAssets: ["unexpected.jpg"],
		changedPeopleOriginals: ["person.jpg"],
		extraPeopleOriginals: ["extra.jpg"],
		picturesEqual: true,
	})
})
