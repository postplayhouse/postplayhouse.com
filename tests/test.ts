import { expect, test } from "@playwright/test"

test("index page identifies Post Playhouse", async ({ page }) => {
	await page.goto("/")
	await expect(page).toHaveTitle("Post Playhouse")
})
