import { expect, test } from "@playwright/test"

test("home page loads", async ({ page }) => {
	await page.goto("/")
	await expect(page).toHaveTitle(/Post Playhouse/)
})

test.describe("People pages", () => {
	test("current season /who/2026 loads people data", async ({ page }) => {
		await page.goto("/who/2026/")
		// Should show at least one person
		await expect(page.locator("text=Don Denton")).toBeVisible()
	})

	test("historical year /who/2025 loads people data", async ({ page }) => {
		await page.goto("/who/2025/")
		await expect(page.locator("text=Don Denton")).toBeVisible()
	})

	test("program-bios page loads current season data", async ({ page }) => {
		await page.goto("/program-bios/")
		// Should have bios content
		await expect(page.locator("body")).toContainText("bio")
	})
})

test.describe("SSR page cache headers", () => {
	test("GET /who/2026/ has correct cache headers for current season", async ({
		request,
	}) => {
		const response = await request.get("/who/2026/")
		expect(response.ok()).toBeTruthy()

		const headers = response.headers()
		expect(headers["cache-control"]).toBe("public, max-age=0")
		expect(headers["cache-tag"]).toBe("people-2026,bios")
		expect(headers["netlify-cdn-cache-control"]).toBe(
			"public, max-age=86400, stale-while-revalidate=3600",
		)
	})

	test("GET /program-bios/ has correct cache headers", async ({ request }) => {
		const response = await request.get("/program-bios/")
		expect(response.ok()).toBeTruthy()

		const headers = response.headers()
		expect(headers["cache-control"]).toBe("public, max-age=0")
		expect(headers["cache-tag"]).toBe("people-2026,bios")
		expect(headers["netlify-cdn-cache-control"]).toBe(
			"public, max-age=86400, stale-while-revalidate=3600",
		)
	})
})

test.describe("SSR API endpoint", () => {
	test("GET /api/people/2026.json returns people data", async ({ request }) => {
		const response = await request.get("/api/people/2026.json")
		expect(response.ok()).toBeTruthy()

		const data = await response.json()
		expect(data.people).toBeDefined()
		expect(data.people.length).toBeGreaterThan(0)
		expect(data.site).toBeDefined()
		expect(data.site.season).toBe(2026)
	})

	test("GET /api/people/2026.json has correct cache headers for current season", async ({
		request,
	}) => {
		const response = await request.get("/api/people/2026.json")
		expect(response.ok()).toBeTruthy()

		const headers = response.headers()
		expect(headers["cache-control"]).toBe("public, max-age=0")
		expect(headers["cache-tag"]).toBe("people-2026,bios")
		expect(headers["netlify-cdn-cache-control"]).toBe(
			"public, max-age=86400, stale-while-revalidate=3600",
		)
	})

	test("GET /api/people/2025.json returns 404 for historical year", async ({
		request,
	}) => {
		const response = await request.get("/api/people/2025.json")
		expect(response.status()).toBe(404)
	})

	test("GET /api/people/9999.json returns 404 for invalid year", async ({
		request,
	}) => {
		const response = await request.get("/api/people/9999.json")
		expect(response.status()).toBe(404)
	})
})
