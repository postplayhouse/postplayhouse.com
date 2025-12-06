import { it, expect, describe } from "vitest"

describe("yaml data", () => {
	it("isn't a mess", async () => {
		const module = await import("./_yaml.js")
		expect(module.default).toBeDefined()
	})
})
