import { expect, test, type Page } from "@playwright/test"

const origin = "http://127.0.0.1:3000"

const pendingBios = [
	{
		position: 12,
		firstName: "Ada",
		lastName: "Lovelace",
		location: "London",
		email: "ada@example.com",
		bio: "Ada's **full website bio**.",
		programBio: "Ada's program bio.",
		staffPositions: ["Engineer"],
		productionPositions: { Hamlet: ["Programmer"] },
		roles: { Hamlet: ["Ada"] },
		originalImageUrl: "originals/2027/ada-lovelace.jpg",
		imageYear: 2027,
		submittedAt: "2026-09-04T12:00:00.000Z",
		baselineGroups: ["staff"],
	},
	{
		position: 7,
		firstName: "Grace",
		lastName: "Hopper",
		location: "New York",
		email: "grace@example.com",
		bio: "Grace's website bio.",
		originalImageUrl: "src/images/people/2026/jo-arnold.jpg",
		imageYear: 2026,
		submittedAt: "2026-09-03T12:00:00.000Z",
		baselineGroups: [],
	},
]

function configuredPassphrases() {
	const passphrases = process.env.INDIVIDUAL_PASSPHRASES_LIST!.split(",")
	const adminPositions = new Set(
		process.env.ADMIN_PASSPHRASE_POSITIONS!.split(",").map(Number),
	)
	const adminIndex = passphrases.findIndex((_, index) =>
		adminPositions.has(index + 1),
	)
	const memberIndex = passphrases.findIndex(
		(_, index) => !adminPositions.has(index + 1),
	)

	expect(adminIndex).toBeGreaterThanOrEqual(0)
	expect(memberIndex).toBeGreaterThanOrEqual(0)
	return {
		admin: passphrases[adminIndex],
		member: passphrases[memberIndex],
	}
}

function sanitized(passphrase: string) {
	return passphrase
		.replace(/[^A-Za-z]/g, "")
		.toLowerCase()
		.trim()
}

async function loadPendingBios(page: Page, passphrase: string) {
	await page.goto(`${origin}/admin/bios`, { waitUntil: "networkidle" })
	await page.getByLabel("Passphrase").fill(passphrase)
	await page.getByRole("button", { name: "Load pending bios" }).click()
	await expect(page.getByRole("status")).toHaveText("2 pending bios loaded.")
}

async function mockPendingBios(page: Page) {
	await page.route("**/api/admin/bios", async (route) => {
		await route.fulfill({ json: { bios: pendingBios } })
	})
	await page.route("**/api/admin/bios/image?*", async (route) => {
		await route.fulfill({
			body: Buffer.from(
				"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
				"base64",
			),
			contentType: "image/png",
		})
	})
}

test.describe("Admin bio approval API authorization", () => {
	test("actual endpoints reject unauthenticated and non-admin requests", async ({
		request,
	}) => {
		const { member } = configuredPassphrases()
		const requests = [
			(headers?: Record<string, string>) =>
				request.get(`${origin}/api/admin/bios`, { headers }),
			(headers?: Record<string, string>) =>
				request.post(`${origin}/api/admin/bios/approve`, {
					headers,
					data: { position: 12 },
				}),
			(headers?: Record<string, string>) =>
				request.post(`${origin}/api/admin/bios/reject`, {
					headers,
					data: { position: 12 },
				}),
			(headers?: Record<string, string>) =>
				request.get(
					`${origin}/api/admin/bios/image?path=originals%2F2027%2Fada.jpg`,
					{ headers },
				),
			(headers?: Record<string, string>) =>
				request.post(`${origin}/api/admin/bios/purge-cache`, { headers }),
		]

		for (const send of requests) {
			const unauthenticated = await send()
			expect(unauthenticated.status()).toBe(403)

			const nonAdmin = await send({ Authorization: member })
			expect(nonAdmin.status()).toBe(403)
			expect(await nonAdmin.json()).toMatchObject({
				message: "Admin access required",
			})
		}
	})
})

test.describe("Admin bio approval UI", () => {
	test("announces an authentication failure, retries, and renders pending Bio previews", async ({
		page,
	}) => {
		const { admin, member } = configuredPassphrases()
		const imageRequests: URL[] = []
		await page.route("**/api/admin/bios", async (route) => {
			if (route.request().headers().authorization === sanitized(admin)) {
				await route.fulfill({ json: { bios: pendingBios } })
			} else {
				await route.fulfill({
					status: 403,
					json: { message: "Admin access required" },
				})
			}
		})
		await page.route("**/api/admin/bios/image?*", async (route) => {
			imageRequests.push(new URL(route.request().url()))
			await route.fulfill({ body: "image", contentType: "image/jpeg" })
		})

		await page.goto(`${origin}/admin/bios`, { waitUntil: "networkidle" })
		await expect(
			page.getByRole("heading", { name: "Bio approvals", level: 1 }),
		).toBeVisible()
		await page.getByLabel("Passphrase").fill(member)
		await page.getByRole("button", { name: "Load pending bios" }).click()
		await expect(page.getByRole("alert")).toHaveText("Admin access required")

		await page.getByLabel("Passphrase").fill(` ${admin.toUpperCase()} 123 `)
		await page.getByRole("button", { name: "Load pending bios" }).click()
		await expect(page.getByRole("status")).toHaveText("2 pending bios loaded.")
		const cards = page.getByRole("article")
		await expect(cards).toHaveCount(2)
		await expect(
			cards.first().getByRole("heading", { name: "Grace Hopper" }),
		).toBeVisible()

		const ada = cards.filter({
			has: page.getByRole("heading", { name: "Ada Lovelace" }),
		})
		await expect(ada.getByText("Position:").locator("..")).toContainText("12")
		await expect(ada.getByLabel("Email")).toHaveValue("ada@example.com")
		await expect(ada.getByText("Image year:").locator("..")).toContainText(
			"2027",
		)
		await expect(ada.getByLabel("Program bio (optional)")).toHaveValue(
			"Ada's program bio.",
		)
		await expect(ada.getByLabel("Production positions")).toHaveValue(
			/"Programmer"/,
		)
		await expect(ada.getByLabel("Roles")).toHaveValue(/"Ada"/)
		await expect(ada.getByText("full website bio", { exact: true })).toHaveRole(
			"strong",
		)
		const portrait = ada.getByRole("img", { name: "portrait of Ada Lovelace" })
		await expect(portrait).toHaveAttribute(
			"src",
			`/api/admin/bios/image?path=originals%2F2027%2Fada-lovelace.jpg&auth=${sanitized(admin)}`,
		)
		await expect.poll(() => imageRequests.length).toBeGreaterThan(0)
		expect(imageRequests[0].pathname).toBe("/api/admin/bios/image")
		expect(imageRequests[0].searchParams.get("auth")).toBe(sanitized(admin))
	})

	test("approves with reviewed content and an explicit group patch", async ({
		page,
	}) => {
		const { admin } = configuredPassphrases()
		await mockPendingBios(page)
		let finishApproval!: () => void
		const approvalCanFinish = new Promise<void>((resolve) => {
			finishApproval = resolve
		})
		await page.route("**/api/admin/bios/approve", async (route) => {
			await approvalCanFinish
			await route.fulfill({ json: { success: true } })
		})
		await loadPendingBios(page, admin)

		const ada = page.getByRole("article").filter({ hasText: "Ada Lovelace" })
		await ada.getByLabel("First name").fill("Augusta")
		await ada.getByRole("checkbox", { name: "staff" }).uncheck()
		await ada.getByRole("checkbox", { name: "cast" }).check()
		const approvalRequest = page.waitForRequest("**/api/admin/bios/approve")
		await ada.getByRole("button", { name: "Approve" }).click()
		const request = await approvalRequest
		expect(request.postDataJSON()).toEqual({
			position: 12,
			reviewed: {
				firstName: "Augusta",
				lastName: "Lovelace",
				location: "London",
				email: "ada@example.com",
				bio: "Ada's **full website bio**.",
				programBio: "Ada's program bio.",
				staffPositions: ["Engineer"],
				productionPositions: { Hamlet: ["Programmer"] },
				roles: { Hamlet: ["Ada"] },
			},
			metadata: { groups: ["cast"] },
		})
		expect(request.headers().authorization).toBe(sanitized(admin))
		await expect(ada.getByRole("button", { name: "Approving…" })).toBeDisabled()
		finishApproval()

		await expect(ada).toHaveCount(0)
		await expect(page.getByRole("status")).toHaveText("Ada Lovelace approved.")
		await expect(page.getByText("1 pending bio")).toBeVisible()
	})

	test("confirms permanent rejection, sends an optional reason, and restores focus", async ({
		page,
	}) => {
		const { admin } = configuredPassphrases()
		await mockPendingBios(page)
		await page.route("**/api/admin/bios/reject", async (route) => {
			await route.fulfill({ json: { success: true } })
		})
		await loadPendingBios(page, admin)

		const ada = page.getByRole("article").filter({ hasText: "Ada Lovelace" })
		const rejectButton = ada.getByRole("button", { name: "Reject" })
		await rejectButton.click()
		const dialog = page.getByRole("dialog", {
			name: "Reject Ada Lovelace’s bio?",
		})
		await expect(dialog).toBeVisible()
		await expect(dialog.getByRole("heading")).toBeFocused()
		await expect(dialog).toContainText(
			"This permanently deletes the pending submission and cannot be undone.",
		)
		await expect(dialog).toContainText("admin Basecamp chat")
		await page.keyboard.press("Escape")
		await expect(dialog).toHaveCount(0)
		await expect(rejectButton).toBeFocused()

		await rejectButton.click()
		await page.getByLabel("Reason (optional)").fill("  Please revise.  ")
		const rejectionRequest = page.waitForRequest("**/api/admin/bios/reject")
		await page.getByRole("button", { name: "Permanently reject" }).click()
		const request = await rejectionRequest
		expect(request.postDataJSON()).toEqual({
			position: 12,
			reason: "Please revise.",
		})
		expect(request.headers().authorization).toBe(sanitized(admin))
		await expect(ada).toHaveCount(0)
		await expect(page.getByRole("status")).toHaveText(
			"Ada Lovelace rejected and Basecamp notified.",
		)
	})

	test("represents completed deletion when Basecamp notification fails on mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 })
		const { admin } = configuredPassphrases()
		await mockPendingBios(page)
		let requestBody: unknown
		await page.route("**/api/admin/bios/reject", async (route) => {
			requestBody = route.request().postDataJSON()
			await route.fulfill({
				status: 502,
				json: { message: "Bio rejected, but Basecamp notification failed" },
			})
		})
		await loadPendingBios(page, admin)

		const ada = page.getByRole("article").filter({ hasText: "Ada Lovelace" })
		await ada.getByRole("button", { name: "Reject" }).click()
		const dialog = page.getByRole("dialog", {
			name: "Reject Ada Lovelace’s bio?",
		})
		await expect(dialog).toBeVisible()
		await expect(page.getByRole("button", { name: "Close" })).toBeVisible()
		await dialog.getByRole("button", { name: "Permanently reject" }).click()

		expect(requestBody).toEqual({ position: 12 })
		await expect(dialog).toHaveCount(0)
		await expect(ada).toHaveCount(0)
		await expect(page.getByRole("status")).toHaveText(
			"Ada Lovelace was permanently rejected, but the Basecamp notification failed.",
		)
		await expect(
			page.getByRole("heading", { name: "Grace Hopper" }),
		).toBeVisible()
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth),
		).toBeLessThanOrEqual(375)
	})

	test("shows actual simulated purge success and structured partial results", async ({
		page,
	}) => {
		const { admin } = configuredPassphrases()
		await mockPendingBios(page)
		await loadPendingBios(page, admin)

		const actualResponse = page.waitForResponse("**/api/admin/bios/purge-cache")
		await page.getByRole("button", { name: "Done Approving" }).click()
		expect((await actualResponse).status()).toBe(200)
		const complete = page.getByRole("heading", {
			name: "Cache update complete (simulated)",
		})
		await expect(complete).toBeVisible()
		const result = complete.locator("..")
		await expect(result.getByText(/Purge tag/)).toContainText("succeeded")
		await expect(result.getByRole("listitem")).toHaveCount(3)
		await expect(result.getByRole("listitem")).toContainText([
			"/who/2027/: succeeded (status: simulated)",
			"/program-bios/: succeeded (status: simulated)",
			"/api/people/2027.json: succeeded (status: simulated)",
		])

		await page.route("**/api/admin/bios/purge-cache", async (route) => {
			await route.fulfill({
				status: 502,
				json: {
					success: false,
					simulated: false,
					purge: { tag: "bios", success: true, status: 202 },
					warming: [
						{ url: "/who/2027/", success: true, status: 200 },
						{ url: "/program-bios/", success: false, status: 503 },
					],
				},
			})
		})
		await page.getByRole("button", { name: "Done Approving" }).click()
		const incomplete = page.getByRole("heading", {
			name: "Cache update incomplete",
		})
		await expect(incomplete).toBeVisible()
		const partialResult = incomplete.locator("..")
		await expect(partialResult.getByText(/Purge tag/)).toContainText(
			"succeeded",
		)
		await expect(partialResult.getByRole("listitem").nth(0)).toContainText(
			"succeeded",
		)
		await expect(partialResult.getByRole("listitem").nth(1)).toContainText(
			"failed (status: 503)",
		)
	})
})
