import { beforeEach, describe, expect, it, vi } from "vitest"

const privateEnv = vi.hoisted(() => ({
	INDIVIDUAL_PASSPHRASES_LIST: "member-passphrase,admin-passphrase",
	ADMIN_PASSPHRASE_POSITIONS: "2",
	CONTEXT: "deploy-preview",
	PLAYWRIGHT_TEST: "true",
	NETLIFY_API_TOKEN: "test-netlify-token",
	NETLIFY_SITE_ID: "test-site-id",
}))

vi.mock("$env/dynamic/private", () => ({ env: privateEnv }))

import { POST } from "./+server"

function createEvent(authorization?: string) {
	const headers = new Headers()
	if (authorization) headers.set("Authorization", authorization)

	return {
		request: new Request("https://example.com/api/admin/bios/purge-cache", {
			method: "POST",
			headers,
		}),
		url: new URL("https://example.com/api/admin/bios/purge-cache"),
	}
}

describe("POST /api/admin/bios/purge-cache", () => {
	beforeEach(() => {
		privateEnv.CONTEXT = "deploy-preview"
		privateEnv.PLAYWRIGHT_TEST = "true"
		vi.restoreAllMocks()
	})

	it.each([
		["missing authorization", undefined],
		["invalid authorization", "not-valid"],
		["non-admin authorization", "member-passphrase"],
	])("returns 403 for %s", async (_case, authorization) => {
		await expect(
			POST(createEvent(authorization) as never),
		).rejects.toMatchObject({
			status: 403,
		})
	})

	it("simulates the purge and each warm request without fetching", async () => {
		const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {})
		const fetchSpy = vi.spyOn(globalThis, "fetch")
		privateEnv.CONTEXT = "production"
		const requestEvent = createEvent("admin-passphrase")

		const response = await POST(requestEvent as never)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			success: true,
			simulated: true,
			purge: { tag: "bios", success: true, status: "simulated" },
			warming: [
				{ url: "/who/2027/", success: true, status: "simulated" },
				{ url: "/program-bios/", success: true, status: "simulated" },
				{
					url: "/api/people/2027.json",
					success: true,
					status: "simulated",
				},
			],
		})
		expect(fetchSpy).not.toHaveBeenCalled()
		expect(consoleInfo).toHaveBeenCalledOnce()
	})

	it("purges the bios tag before warming each URL in production", async () => {
		privateEnv.CONTEXT = "production"
		privateEnv.PLAYWRIGHT_TEST = "false"
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(new Response(null, { status: 202 }))
			.mockResolvedValue(new Response(null, { status: 200 }))

		const response = await POST(createEvent("admin-passphrase") as never)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			success: true,
			simulated: false,
			purge: { tag: "bios", success: true, status: 202 },
			warming: [
				{ url: "/who/2027/", success: true, status: 200 },
				{ url: "/program-bios/", success: true, status: 200 },
				{ url: "/api/people/2027.json", success: true, status: 200 },
			],
		})
		expect(fetchSpy).toHaveBeenNthCalledWith(
			1,
			"https://api.netlify.com/api/v1/purge",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({
					site_id: "test-site-id",
					cache_tags: ["bios"],
				}),
			}),
		)
		expect(
			fetchSpy.mock.calls.slice(1).map(([input]) => String(input)),
		).toEqual([
			"https://example.com/who/2027/",
			"https://example.com/program-bios/",
			"https://example.com/api/people/2027.json",
		])
	})
})
