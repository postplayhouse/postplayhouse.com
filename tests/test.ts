import { expect, test } from "@playwright/test"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"

test("index page identifies Post Playhouse", async ({ page }) => {
	await page.goto("/")
	await expect(page).toHaveTitle("Post Playhouse")
	await expect(
		page.getByRole("heading", { name: "Announcing our 2027 Season!" }),
	).toBeVisible()
	const announcement = page.getByAltText(
		"Show logos for Annie, The Drowsy Chaperone, Footloose, The Addams Family, and Honky Tonk Angels in the 2027 Post Playhouse season",
	)
	await expect(announcement).toBeVisible()
	await expect(announcement).toHaveJSProperty("complete", true)
	expect(
		await announcement.evaluate(
			(element) => (element as HTMLImageElement).naturalWidth,
		),
	).toBeGreaterThan(0)
})

test("site header layout stays stable across color themes", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" })
	const positions = () =>
		page.locator("header, nav, main").evaluateAll((elements) =>
			elements.map((element) => {
				const { x, y, width, height } = element.getBoundingClientRect()
				return {
					x,
					y,
					width,
					...(element.tagName === "MAIN" ? {} : { height }),
				}
			}),
		)
	const navigationColor = () =>
		page.locator("nav").evaluate((element) => getComputedStyle(element).color)
	for (const width of [390, 1280]) {
		await page.setViewportSize({ width, height: 900 })
		for (const path of ["/", "/media"]) {
			await page.emulateMedia({ colorScheme: "light" })
			const response = await page.goto(path)
			expect(response?.status(), path).toBeLessThan(400)
			await expect(
				page.getByRole("img", {
					name: "Post Playhouse — established 1967, celebrating 60 years",
				}),
			).toBeVisible()
			await page.evaluate(() => document.fonts.ready)
			const lightPositions = await positions()
			const lightColor = await navigationColor()
			await page.emulateMedia({ colorScheme: "dark" })
			await expect.poll(navigationColor).not.toBe(lightColor)
			expect(await positions()).toEqual(lightPositions)
			await page.emulateMedia({ colorScheme: "light" })
			await expect.poll(navigationColor).toBe(lightColor)
			expect(await positions()).toEqual(lightPositions)
		}
	}
})

test("anniversary artwork animates before hydration without reloading", async ({
	page,
}) => {
	await page.emulateMedia({
		colorScheme: "dark",
		reducedMotion: "no-preference",
	})
	const artwork = /\/images\/anniversary-60-(standard|reversed)\.svg$/
	const requests: string[] = []
	page.on("request", (request) => {
		if (artwork.test(request.url())) requests.push(request.url())
	})
	let release = () => {}
	const hydration = new Promise<void>((resolve) => (release = resolve))
	await page.route("**/*", async (route) => {
		if (route.request().resourceType() === "script") await hydration
		await route.continue()
	})
	try {
		// Hold JavaScript until the server-rendered artwork has finished loading.
		// Use a nested route too: relative SVG references vary with page depth.
		await page.goto("/about/", { waitUntil: "commit" })
		await expect
			.poll(() =>
				page.evaluate(
					(pattern) =>
						performance
							.getEntriesByType("resource")
							.filter((entry) =>
								new RegExp(pattern).test(new URL(entry.name).pathname),
							).length,
					artwork.source,
				),
			)
			.toBe(2)
		const initialRequests = [...requests]
		await expect
			.poll(() =>
				page
					.locator(".ray-layer")
					.evaluate((element) =>
						element
							.getAnimations()
							.some(
								(animation) =>
									animation.playState === "running" &&
									Number(animation.currentTime) > 0,
							),
					),
			)
			.toBe(true)
		release()
		await page.waitForLoadState("networkidle")
		// Verify the power-saving controller still takes over after hydration.
		await page.emulateMedia({ reducedMotion: "reduce" })
		await expect(page.locator("[data-anniversary-burst]")).toHaveAttribute(
			"data-motion",
			"still",
		)
		await page.emulateMedia({ reducedMotion: "no-preference" })
		await expect(page.locator("[data-anniversary-burst]")).toHaveAttribute(
			"data-motion",
			"running",
		)
		expect(requests).toEqual(initialRequests)
	} finally {
		release()
	}
})

test("anniversary logo preserves the original composition and transparent highlights", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" })
	await page.goto("/")
	const logo = page.getByRole("img", {
		name: "Post Playhouse — established 1967, celebrating 60 years",
	})
	const { data, info: pixels } = await sharp(await logo.screenshot())
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true })
	expect(pixels.width / pixels.height).toBeCloseTo(108 / 88, 2)
	// This gap between the digits is inside the PDF highlight's rectangular
	// bounds, but outside the actual highlight. Broken WebKit masking fills it.
	// Original PDF coordinates, with only the blank canvas margins trimmed.
	const x = Math.round(((70.5 - 18) / 108) * pixels.width)
	const y = Math.round(((91 - 36) / 88) * pixels.height)
	const offset = (y * pixels.width + x) * 4
	expect(Math.max(...data.subarray(offset, offset + 3))).toBeLessThan(40)
	// A missing numeral would also leave a dark gap: require its green body too.
	const body =
		(Math.round(((101 - 36) / 88) * pixels.height) * pixels.width +
			Math.round(((58 - 18) / 108) * pixels.width)) *
		4
	const [r, g, b] = data.subarray(body, body + 3)
	expect(g - r).toBeGreaterThan(30)
	expect(g - b).toBeGreaterThan(10)
	// In the original PDF, the green tops of 6 and 0 cover PLAYHOUSE's H and O.
	for (const pdfX of [65, 78.2]) {
		const overlap =
			(Math.round(((87 - 36) / 88) * pixels.height) * pixels.width +
				Math.round(((pdfX - 18) / 108) * pixels.width)) *
			4
		const [red, green, blue] = data.subarray(overlap, overlap + 3)
		expect(green - red).toBeGreaterThan(30)
		expect(green - blue).toBeGreaterThan(10)
	}
	// The separated glint must still be present at rest, not just a dark numeral.
	const glint =
		(Math.round(((97.75 - 36) / 88) * pixels.height) * pixels.width +
			Math.round(((70 - 18) / 108) * pixels.width)) *
		4
	expect(Math.min(...data.subarray(glint, glint + 3))).toBeGreaterThan(215)
	const stem =
		(Math.round(((58.26 - 36) / 88) * pixels.height) * pixels.width +
			Math.round(((34.35 - 18) / 108) * pixels.width)) *
		4
	expect(Math.min(...data.subarray(stem, stem + 3))).toBeGreaterThan(230)
})

test("anniversary highlights resume after theme and motion-preference changes", async ({
	page,
}) => {
	await page.emulateMedia({
		colorScheme: "light",
		reducedMotion: "no-preference",
	})
	await page.goto("/")
	const highlights = page.locator("[data-sparkle], [data-number-sparkle]")
	await expect(page.locator("[data-number-sparkle]").first()).toBeAttached()
	const count = await highlights.count()
	for (const [colorScheme, reducedMotion] of [
		["light", "no-preference"],
		["light", "reduce"],
		["dark", "reduce"],
		["dark", "no-preference"],
		["light", "no-preference"],
	] as const) {
		await page.emulateMedia({ colorScheme, reducedMotion })
		await expect
			.poll(() =>
				highlights.evaluateAll((elements) =>
					elements
						.filter(
							(el) => getComputedStyle(el.parentElement!).display !== "none",
						)
						.map((el) =>
							el
								.getAnimations()
								.some((animation) => animation.playState === "running"),
						),
				),
			)
			.toEqual(Array(count).fill(reducedMotion !== "reduce"))
	}
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
