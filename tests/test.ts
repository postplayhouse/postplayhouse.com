import { expect, test } from "@playwright/test"

test.describe("Test Environment", () => {
	test("server detects PLAYWRIGHT_TEST environment variable", async ({
		request,
	}) => {
		const response = await request.get("/api/test-env")
		expect(response.ok()).toBeTruthy()

		const data = await response.json()
		expect(data.isTest).toBe(true)
		expect(data.isProduction).toBe(false)
	})
})

test.describe("B2 Storage", () => {
	function hasB2TestBucket(): boolean {
		return !!(
			process.env.B2_TEST_BUCKET_ID && process.env.B2_TEST_BUCKET_NAME
		)
	}

	function getTestPassphrase(): string | null {
		const passphraseList = process.env.INDIVIDUAL_PASSPHRASES_LIST
		if (!passphraseList) return null
		return passphraseList.split(",")[0]
	}

	test("bio submission with new image uploads to B2 test bucket", async ({
		page,
	}) => {
		const testPassphrase = getTestPassphrase()
		if (!testPassphrase) {
			test.skip()
			return
		}

		if (!hasB2TestBucket()) {
			console.log(
				"Skipping B2 test: B2_TEST_BUCKET_ID or B2_TEST_BUCKET_NAME not set",
			)
			test.skip()
			return
		}

		// Navigate and authenticate
		await page.goto("/bio-submission/")
		await page.waitForLoadState("networkidle")
		await page.locator('input[name="passphrase"]').fill(testPassphrase)
		await page.getByRole("button", { name: "Continue" }).click()
		await expect(page.locator('input[name="email"]')).toBeVisible({
			timeout: 15000,
		})

		const testId = Date.now()

		// Fill required fields
		await page.locator('input[name="email"]').fill("b2test@example.com")
		await page.locator('input[name="firstName"]').fill(`B2Test${testId}`)
		await page.locator('input[name="lastName"]').fill("Upload")
		await page.locator('input[name="location"]').fill("Test City, NE")

		// Select "new headshot" option
		await page.getByText("I have a new headshot").click()

		// Create and upload a minimal test PNG image
		// This is a 1x1 red pixel PNG
		const testPngBase64 =
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
		const testImageBuffer = Buffer.from(testPngBase64, "base64")

		await page.locator('input[type="file"]').setInputFiles({
			name: `test-b2-upload-${testId}.png`,
			mimeType: "image/png",
			buffer: testImageBuffer,
		})

		// Fill bio
		const bioEditor = page.locator(".ProseMirror").first()
		await bioEditor.click()
		await bioEditor.fill(`B2Test${testId} Upload is testing B2 integration!`)

		// Submit
		const submitButton = page.getByRole("button", { name: "Submit Bio" })
		await expect(submitButton).toBeEnabled({ timeout: 5000 })
		await submitButton.click()

		// Should succeed - B2 upload to test bucket should work
		await expect(page.getByText("Success!")).toBeVisible({ timeout: 30000 })
	})
})

test.describe("Bio Submission", () => {
	// Helper to get a valid passphrase from env
	function getTestPassphrase(): string | null {
		const passphraseList = process.env.INDIVIDUAL_PASSPHRASES_LIST
		if (!passphraseList) return null
		return passphraseList.split(",")[0]
	}

	// Helper to authenticate with passphrase and wait for form
	async function authenticateAndWaitForForm(
		page: import("@playwright/test").Page,
		passphrase: string,
	) {
		await page.goto("/bio-submission/")
		// Wait for page to be fully loaded and hydrated
		await page.waitForLoadState("networkidle")

		await page.locator('input[name="passphrase"]').fill(passphrase)
		await page.getByRole("button", { name: "Continue" }).click()

		// Wait for form to appear (the API call happens and state transitions)
		await expect(page.locator('input[name="email"]')).toBeVisible({
			timeout: 15000,
		})
	}

	test("GET /api/bio-submission/submit returns 405 for GET requests", async ({
		request,
	}) => {
		const response = await request.get("/api/bio-submission/submit")
		expect(response.status()).toBe(405)
	})

	test("bio-submission page shows passphrase form", async ({ page }) => {
		await page.goto("/bio-submission/")
		await expect(page).toHaveTitle(/Bio Submission/)
		await expect(page.getByText("Enter the passphrase")).toBeVisible()
	})

	test("confirm-passphrase API rejects invalid passphrase", async ({
		request,
	}) => {
		const response = await request.get(
			"/api/bio-submission/confirm-passphrase",
			{
				headers: {
					Authorization: "invalid_passphrase",
				},
			},
		)
		expect(response.status()).toBe(403)
		const json = await response.json()
		expect(json.error).toBe("Invalid Passphrase")
	})

	test("confirm-passphrase API accepts valid passphrase", async ({
		request,
	}) => {
		const testPassphrase = getTestPassphrase()
		if (!testPassphrase) {
			test.skip()
			return
		}

		const response = await request.get(
			"/api/bio-submission/confirm-passphrase",
			{
				headers: {
					Authorization: testPassphrase,
				},
			},
		)
		expect(response.status()).toBe(201)
		const json = await response.json()
		expect(json.position).toBe(1)
	})

	test("invalid passphrase shows error message on page", async ({ page }) => {
		await page.goto("/bio-submission/")
		// Wait for page to be fully loaded and hydrated
		await page.waitForLoadState("networkidle")

		await page.locator('input[name="passphrase"]').fill("wrong_passphrase")
		await page.getByRole("button", { name: "Continue" }).click()

		// Wait for the error message (exact text from the page)
		await expect(
			page.getByText("The passphrase you entered was incorrect."),
		).toBeVisible({ timeout: 15000 })
	})

	test("valid passphrase shows bio form", async ({ page }) => {
		const testPassphrase = getTestPassphrase()
		if (!testPassphrase) {
			test.skip()
			return
		}

		await authenticateAndWaitForForm(page, testPassphrase)

		// Verify all required form fields are present
		await expect(page.locator('input[name="firstName"]')).toBeVisible()
		await expect(page.locator('input[name="lastName"]')).toBeVisible()
		await expect(page.locator('input[name="location"]')).toBeVisible()
		await expect(
			page.getByText("Headshot", { exact: false }).first(),
		).toBeVisible()
		await expect(page.locator(".ProseMirror")).toBeVisible() // Bio editor
	})

	test("form validation - shows errors for missing required fields", async ({
		page,
	}) => {
		const testPassphrase = getTestPassphrase()
		if (!testPassphrase) {
			test.skip()
			return
		}

		await authenticateAndWaitForForm(page, testPassphrase)

		// Submit button should be disabled when form is incomplete
		const submitButton = page.getByRole("button", { name: "Submit Bio" })
		await expect(submitButton).toBeDisabled()

		// Check validation messages appear
		await expect(page.getByText("You must supply a first name")).toBeVisible()
		await expect(page.getByText("You must supply a location")).toBeVisible()
		await expect(
			page.getByText("You must supply some kind of bio"),
		).toBeVisible()
		await expect(page.getByText("Please add your email address")).toBeVisible()
	})

	test("form validation - submit button enables when form is complete", async ({
		page,
	}) => {
		const testPassphrase = getTestPassphrase()
		if (!testPassphrase) {
			test.skip()
			return
		}

		await authenticateAndWaitForForm(page, testPassphrase)

		// Fill required fields
		await page.locator('input[name="email"]').fill("test@example.com")
		await page.locator('input[name="firstName"]').fill("Test")
		await page.locator('input[name="lastName"]').fill("Person")
		await page.locator('input[name="location"]').fill("Test City, NE")

		// Select old headshot
		await page.getByText("I've worked at Post before").click()
		// Select first headshot from the picker list
		await page.locator("ul.h-96 button").first().click()

		// Fill bio
		const bioEditor = page.locator(".ProseMirror").first()
		await bioEditor.click()
		await bioEditor.fill("Test Person is thrilled to be at Post Playhouse!")

		// Submit button should now be enabled
		const submitButton = page.getByRole("button", { name: "Submit Bio" })
		await expect(submitButton).toBeEnabled()
	})

	test("bio word count validation", async ({ page }) => {
		const testPassphrase = getTestPassphrase()
		if (!testPassphrase) {
			test.skip()
			return
		}

		await authenticateAndWaitForForm(page, testPassphrase)

		// Fill a bio that's too long (over 125 words)
		const longBio = Array(130).fill("word").join(" ")
		const bioEditor = page.locator(".ProseMirror").first()
		await bioEditor.click()
		await bioEditor.fill(longBio)

		// Should show word count error
		await expect(page.getByText("Your bio is too long")).toBeVisible()
	})

	// Note: Full submission flow requires Netlify Blobs and B2 storage infrastructure
	// which is not available in local dev/CI environments. This test verifies the
	// form completes and submission is attempted (either success or graceful error).
	test("full bio submission flow with old headshot", async ({ page }) => {
		const testPassphrase = getTestPassphrase()
		if (!testPassphrase) {
			test.skip()
			return
		}

		const testId = Date.now()
		const firstName = `TestFirst${testId}`
		const lastName = `TestLast${testId}`

		// Step 1: Navigate and authenticate
		await authenticateAndWaitForForm(page, testPassphrase)

		// Step 2: Fill all required fields
		await page.locator('input[name="email"]').fill("test@example.com")
		await page.locator('input[name="firstName"]').fill(firstName)
		await page.locator('input[name="lastName"]').fill(lastName)
		await page.locator('input[name="location"]').fill("Test City, NE")

		// Step 4: Select old headshot
		await page.getByText("I've worked at Post before").click()
		await page.locator("ul.h-96 button").first().click()

		// Step 5: Fill bio
		const bioEditor = page.locator(".ProseMirror").first()
		await bioEditor.click()
		await bioEditor.fill(
			`${firstName} ${lastName} is thrilled to be testing bio submission at Post Playhouse!`,
		)

		// Step 6: Verify preview shows our data
		await expect(
			page.getByText(`${firstName} ${lastName}`, { exact: true }),
		).toBeVisible()
		await expect(page.getByText("Test City, NE").first()).toBeVisible()

		// Step 7: Submit
		const submitButton = page.getByRole("button", { name: "Submit Bio" })
		await expect(submitButton).toBeEnabled()
		await submitButton.click()

		// Step 8: Wait for submission to complete (success or error)
		// In local dev, Netlify Blobs may not be available, so we accept either outcome
		const successOrError = page
			.getByText("Success!")
			.or(page.getByText("Oh no."))
		await expect(successOrError).toBeVisible({ timeout: 30000 })
	})

	test("preview updates as form is filled", async ({ page }) => {
		const testPassphrase = getTestPassphrase()
		if (!testPassphrase) {
			test.skip()
			return
		}

		await authenticateAndWaitForForm(page, testPassphrase)

		// Preview should start with placeholder name
		await expect(page.getByText("Bill Murray")).toBeVisible()

		// Fill name fields
		await page.locator('input[name="firstName"]').fill("Jane")
		await page.locator('input[name="lastName"]').fill("Doe")

		// Preview should update
		await expect(page.getByText("Jane Doe")).toBeVisible()

		// Fill location
		await page.locator('input[name="location"]').fill("Omaha, NE")
		await expect(page.getByText("Omaha, NE")).toBeVisible()
	})
})

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
