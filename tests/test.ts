import { expect, test } from "@playwright/test"
import { createHash } from "node:crypto"

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
