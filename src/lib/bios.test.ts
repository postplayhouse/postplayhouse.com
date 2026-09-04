import { describe, expect, it } from "vitest"
import { approveBioRequestSchema, editableBioSchema } from "./bios"

const reviewed = {
	firstName: "Ada",
	lastName: "Lovelace",
	location: "London",
	email: "ada@example.com",
	bio: "Mathematician",
}

describe("bio contracts", () => {
	it("keeps submitter-owned content free of admin groups", () => {
		expect(
			editableBioSchema.safeParse({ ...reviewed, groups: ["cast"] }).success,
		).toBe(false)
	})

	it.each([
		[{}, undefined],
		[{ groups: [] }, []],
		[{ groups: ["cast", "crew"] }, ["cast", "crew"]],
	])("accepts the documented group patch %j", (metadata, groups) => {
		const result = approveBioRequestSchema.parse({
			position: 12,
			reviewed,
			metadata,
		})
		expect(result.metadata.groups).toEqual(groups)
	})

	it.each([
		[{ groups: ["unknown"] }],
		[{ groups: ["cast", "cast"] }],
		[{ groups: "cast" }],
	])("rejects invalid groups in %j", (metadata) => {
		expect(
			approveBioRequestSchema.safeParse({ position: 12, reviewed, metadata })
				.success,
		).toBe(false)
	})

	it("rejects immutable and unknown fields at every request level", () => {
		expect(
			approveBioRequestSchema.safeParse({
				position: 12,
				reviewed: { ...reviewed, submittedAt: "changed" },
				metadata: {},
			}).success,
		).toBe(false)
		expect(
			approveBioRequestSchema.safeParse({
				position: 12,
				reviewed,
				metadata: { approvedBy: "someone" },
			}).success,
		).toBe(false)
	})
})
