import { beforeEach, describe, expect, test, vi } from "vitest"
import { season } from "$data/seasons"
import type { PendingBio } from "$lib/server/blobs"

const {
	individualPassphraseDetails,
	isAdmin,
	listPendingBios,
	checkedInGroups,
} = vi.hoisted(() => ({
	individualPassphraseDetails: vi.fn(),
	isAdmin: vi.fn(),
	listPendingBios: vi.fn(),
	checkedInGroups: vi.fn(),
}))

vi.mock("../../bio-submission/passphraseHelpers.js", () => ({
	individualPassphraseDetails,
	isAdmin,
}))

vi.mock("$lib/server/blobs", () => ({
	listPendingBios,
}))

vi.mock("$lib/server/bioMetadata", () => ({ checkedInGroups }))

import { GET } from "./+server"

function request(authorization?: string) {
	return new Request("http://localhost/api/admin/bios", {
		headers: authorization ? { Authorization: authorization } : undefined,
	})
}

describe("GET /api/admin/bios", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test("lists current-season pending bios for an admin", async () => {
		const bios: PendingBio[] = [
			{
				position: 12,
				firstName: "Ada",
				lastName: "Lovelace",
				location: "London",
				email: "ada@example.com",
				bio: "A bio",
				originalImageUrl: "originals/2027/ada-lovelace.jpg",
				imageYear: 2027,
				submittedAt: "2026-09-04T12:00:00.000Z",
			},
		]
		individualPassphraseDetails.mockReturnValue({ correct: true, position: 2 })
		isAdmin.mockReturnValue(true)
		listPendingBios.mockResolvedValue(bios)
		checkedInGroups.mockReturnValue(["staff"])

		const response = await GET({ request: request("admin phrase") } as never)

		expect(response.status).toBe(200)
		expect(response.headers.get("content-type")).toContain("application/json")
		expect(await response.json()).toEqual({
			bios: [{ ...bios[0], baselineGroups: ["staff"] }],
		})
		expect(checkedInGroups).toHaveBeenCalledWith(season, 12)
		expect(isAdmin).toHaveBeenCalledWith(2)
		expect(listPendingBios).toHaveBeenCalledWith(season)
	})

	test("returns 403 when authentication is missing", async () => {
		individualPassphraseDetails.mockImplementation(() => {
			throw new Error("Missing passphrase")
		})

		await expect(GET({ request: request() } as never)).rejects.toMatchObject({
			status: 403,
			body: { message: "Invalid passphrase" },
		})
		expect(listPendingBios).not.toHaveBeenCalled()
	})

	test("returns 403 when authentication is invalid", async () => {
		individualPassphraseDetails.mockReturnValue({ correct: false })

		await expect(
			GET({ request: request("wrong phrase") } as never),
		).rejects.toMatchObject({
			status: 403,
			body: { message: "Invalid passphrase" },
		})
		expect(listPendingBios).not.toHaveBeenCalled()
	})

	test("returns 403 when authentication is not an admin", async () => {
		individualPassphraseDetails.mockReturnValue({ correct: true, position: 6 })
		isAdmin.mockReturnValue(false)

		await expect(
			GET({ request: request("member phrase") } as never),
		).rejects.toMatchObject({
			status: 403,
			body: { message: "Admin access required" },
		})
		expect(isAdmin).toHaveBeenCalledWith(6)
		expect(listPendingBios).not.toHaveBeenCalled()
	})
})
