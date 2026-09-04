import { describe, expect, it } from "vitest"
import type { ApprovedBio } from "$lib/server/blobs"
import { _mergeBiosWithYaml } from "./+server"

const approved: ApprovedBio = {
	position: 1,
	firstName: "Ada",
	lastName: "Lovelace",
	location: "London",
	email: "ada@example.com",
	bio: "Reviewed bio",
	originalImageUrl: "original.jpg",
	imageYear: 2027,
	submittedAt: "2026-09-04T00:00:00.000Z",
}

describe("approved bio overlay", () => {
	it.each([
		[undefined, ["staff"]],
		[[], []],
		[
			["cast", "crew"],
			["cast", "crew"],
		],
	] as const)("overlays groups %j as %j", (groups, expected) => {
		const yamlPerson = {
			first_name: "Original",
			last_name: "Person",
			groups: ["staff" as const],
		}
		const result = _mergeBiosWithYaml(
			[yamlPerson],
			[
				{
					...approved,
					...(groups === undefined ? {} : { groups: [...groups] }),
				},
			],
		)
		expect(result[0].groups).toEqual(expected)
	})
})
