import { expect, test } from "@playwright/test"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"

test.describe("Test environment", () => {
	test("server detects Playwright isolation", async ({ request }) => {
		const response = await request.get("/api/test-env")
		expect(response.ok()).toBeTruthy()
		expect(await response.json()).toMatchObject({
			isTest: true,
			isProduction: false,
		})
	})
})

test.describe("Bio submission", () => {
	const testPassphrase = () =>
		process.env.INDIVIDUAL_PASSPHRASES_LIST?.split(",")[0]

	test("submission endpoint rejects GET", async ({ request }) => {
		const response = await request.get("/api/bio-submission/submit")
		expect(response.status()).toBe(405)
	})

	test("page shows the passphrase form", async ({ page }) => {
		await page.goto("/bio-submission/")
		await expect(page).toHaveTitle(/Bio Submission/)
		await expect(page.getByText("Enter the passphrase")).toBeVisible()
	})

	test("confirm-passphrase rejects an invalid passphrase", async ({ request }) => {
		const response = await request.get(
			"/api/bio-submission/confirm-passphrase",
			{ headers: { Authorization: "invalid_passphrase" } },
		)
		expect(response.status()).toBe(403)
		expect((await response.json()).error).toBe("Invalid Passphrase")
	})

	test("confirm-passphrase accepts a configured passphrase", async ({
		request,
	}) => {
		const passphrase = testPassphrase()
		test.skip(!passphrase, "No test passphrase configured")
		const response = await request.get(
			"/api/bio-submission/confirm-passphrase",
			{ headers: { Authorization: passphrase! } },
		)
		expect(response.status()).toBe(201)
		expect((await response.json()).position).toBe(1)
	})
})

test("index page identifies Post Playhouse", async ({ page }) => {
	await page.goto("/")
	await expect(page).toHaveTitle("Post Playhouse")
})

test("historical people and production pictures preserve responsive metadata", async ({
	page,
}) => {
	await page.goto("/who/2026/")
	const person = page.locator('picture img[alt="portrait of Jo Arnold"]')
	await expect(person).toHaveAttribute("width", "800")
	await expect(person).toHaveAttribute("height", "533")
	await expect(person).toHaveClass(
		"mb-4 block w-full max-w-md border border-gray-200 md:float-left md:mr-4 md:w-1/2",
	)
	await expect(person).toHaveJSProperty("complete", true)
	expect(
		await person.evaluate(
			(element) => (element as HTMLImageElement).naturalWidth,
		),
	).toBeGreaterThan(0)

	await page.goto("/productions/2026/")
	const production = page.locator('picture img[alt="Show Logo for Seussical"]')
	await expect(production).toHaveAttribute("width", "1042")
	await expect(production).toHaveAttribute("height", "1042")
	expect(
		await production
			.locator("xpath=..")
			.locator("source")
			.evaluateAll((sources) =>
				sources.map((source) => source.getAttribute("type")),
			),
	).toEqual(["image/avif", "image/webp", "image/png"])
})

test("historical responsive images load with the preserved source order", async ({
	page,
}) => {
	await page.goto("/news/2024-02-06-annual-raffle/")
	const images = page.locator('picture img[alt="Raffle 2019"]')
	await expect(images).toHaveCount(2)
	for (const image of await images.all()) {
		await expect(image).toHaveJSProperty("complete", true)
		expect(
			await image.evaluate(
				(element) => (element as HTMLImageElement).naturalWidth,
			),
		).toBeGreaterThan(0)
	}
	await expect(images.first()).toHaveClass(
		/aspect-3\/4 -rotate-6 rounded-lg object-cover shadow-lg/,
	)
	await expect(
		page
			.locator('picture:has(img[alt="Raffle 2019"])')
			.first()
			.locator("source"),
	).toHaveCount(3)
	expect(
		await page
			.locator('picture:has(img[alt="Raffle 2019"])')
			.first()
			.locator("source")
			.evaluateAll((sources) =>
				sources.map((source) => source.getAttribute("type")),
			),
	).toEqual(["image/avif", "image/webp", "image/jpeg"])
})

test("people originals remain byte-identical downloads", async ({
	request,
}) => {
	const response = await request.get("/images/people/2018/ken-phillips.jpg")
	expect(response.ok()).toBe(true)
	expect(
		createHash("sha256")
			.update(await response.body())
			.digest("hex"),
	).toBe("6b4504048ac62846ef932f9904fb3f3153a6592e42e59eac7feaa57c7f415aa0")
})

test("bio headshot lookup returns one approved historical picture", async ({
	request,
}) => {
	const response = await request.get(
		"/bio-submission/historical-headshot?id=2026%2Fjo-arnold.jpg",
	)
	expect(response.ok()).toBe(true)
	const record = await response.json()
	expect(Object.keys(record)).toEqual(["id", "picture"])
	expect(record).toEqual({
		id: "2026/jo-arnold.jpg",
		picture: {
			sources: {
				avif: "/_app/immutable/assets/jo-arnold.B64bAtGj.avif 400w, /_app/immutable/assets/jo-arnold.RU8Vb0L4.avif 800w",
				webp: "/_app/immutable/assets/jo-arnold.qd8vFYq1.webp 400w, /_app/immutable/assets/jo-arnold.DUN67QxW.webp 800w",
				jpeg: "/_app/immutable/assets/jo-arnold.Cdd2U4sI.jpg 400w, /_app/immutable/assets/jo-arnold.0V-O-8LM.jpg 800w",
			},
			img: {
				src: "/_app/immutable/assets/jo-arnold.0V-O-8LM.jpg",
				w: 800,
				h: 533,
			},
		},
	})

	const asset = await request.get(
		"/_app/immutable/assets/jo-arnold.RU8Vb0L4.avif",
	)
	expect(asset.ok()).toBe(true)
	expect(asset.headers()["content-type"]).toBe("image/avif")

	expect(
		(
			await request.get(
				"/bio-submission/historical-headshot?id=..%2F2026%2Fjo-arnold.jpg",
			)
		).status(),
	).toBe(404)
	for (const query of [
		"",
		"?id=2026%2FJO-ARNOLD.JPG",
		"?id=2027%2Fcurrent.jpg",
		"?id=2026%2Fmissing.jpg",
		"?id=%252e%252e%252F2026%252Fjo-arnold.jpg",
	])
		expect(
			(
				await request.get(`/bio-submission/historical-headshot${query}`)
			).status(),
		).toBe(404)
})

test("complete historical metadata stays out of client bundles", async () => {
	const root = ".svelte-kit/output/client/_app/immutable"
	const javascript: string[] = []
	async function visit(directory: string) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name)
			if (entry.isDirectory()) await visit(path)
			else if (entry.name.endsWith(".js")) javascript.push(path)
		}
	}
	await visit(root)
	const clientSource = (
		await Promise.all(javascript.map((path) => readFile(path, "utf8")))
	).join("\n")
	const generatedMap = await readFile(
		"src/lib/server/generated/historical-images.ts",
		"utf8",
	)
	const archivedUrls = new Set(
		generatedMap.match(/\/_app\/immutable\/assets\/[A-Za-z0-9_.%+-]+/g) ?? [],
	)
	const leakedUrls = [...archivedUrls].filter((url) =>
		clientSource.includes(url),
	)
	expect(archivedUrls.size).toBeGreaterThan(4_000)
	expect(leakedUrls).toEqual([])
	expect(clientSource).not.toContain("historicalPeoplePictures")
})

test("prerender data contains only the route-selected historical pictures", async () => {
	const data = await readFile("build/who/2026/__data.json", "utf8")
	const selectedUrls = new Set(
		data.match(/\/_app\/immutable\/assets\/[A-Za-z0-9_.%+-]+/g) ?? [],
	)
	expect(selectedUrls.size).toBeGreaterThan(300)
	expect(selectedUrls.size).toBeLessThan(400)
	expect(data).toContain("jo-arnold.B64bAtGj.avif")
	expect(data).not.toContain("ken-phillips.CDNuwayB.avif")
})

test.describe("People pages", () => {
	test("current season loads people data", async ({ page }) => {
		await page.goto("/who/2027/")
		await expect(page.getByText("Don Denton", { exact: true })).toBeVisible()
	})

	test("historical season loads people data", async ({ page }) => {
		await page.goto("/who/2026/")
		await expect(page.getByText("Don Denton", { exact: true })).toBeVisible()
	})

	test("program-bios loads current season data", async ({ page }) => {
		await page.goto("/program-bios/")
		await expect(page.locator("body")).toContainText("bio")
	})
})

test.describe("SSR page cache headers", () => {
	test("current-season people page has tagged cache headers", async ({
		request,
	}) => {
		const response = await request.get("/who/2027/")
		expect(response.ok()).toBeTruthy()
		expect(response.headers()["cache-control"]).toBe("public, max-age=0")
		expect(response.headers()["cache-tag"]).toBe("people-2027,bios")
		expect(response.headers()["netlify-cdn-cache-control"]).toBe(
			"public, max-age=86400, stale-while-revalidate=3600",
		)
	})

	test("program-bios has tagged cache headers", async ({ request }) => {
		const response = await request.get("/program-bios/")
		expect(response.ok()).toBeTruthy()
		expect(response.headers()["cache-control"]).toBe("public, max-age=0")
		expect(response.headers()["cache-tag"]).toBe("people-2027,bios")
		expect(response.headers()["netlify-cdn-cache-control"]).toBe(
			"public, max-age=86400, stale-while-revalidate=3600",
		)
	})
})

test.describe("SSR people API", () => {
	test("returns current-season people data and cache headers", async ({
		request,
	}) => {
		const response = await request.get("/api/people/2027.json")
		expect(response.ok()).toBeTruthy()

		const data = await response.json()
		expect(data.people.length).toBeGreaterThan(0)
		expect(data.site.season).toBe(2027)
		expect(response.headers()["cache-control"]).toBe("public, max-age=0")
		expect(response.headers()["cache-tag"]).toBe("people-2027,bios")
		expect(response.headers()["netlify-cdn-cache-control"]).toBe(
			"public, max-age=86400, stale-while-revalidate=3600",
		)
	})

	test("returns 404 for a historical season", async ({ request }) => {
		const response = await request.get("/api/people/2026.json")
		expect(response.status()).toBe(404)
	})

	test("returns 404 for an invalid year", async ({ request }) => {
		const response = await request.get("/api/people/9999.json")
		expect(response.status()).toBe(404)
	})
})
