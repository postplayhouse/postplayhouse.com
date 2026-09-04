import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	individualPassphraseDetails: vi.fn(),
	savePendingBio: vi.fn(),
	uploadFileToB2: vi.fn(),
}))

vi.mock("../passphraseHelpers", () => ({
	individualPassphraseDetails: mocks.individualPassphraseDetails,
}))
vi.mock("$lib/server/blobs", () => ({ savePendingBio: mocks.savePendingBio }))
vi.mock("$lib/server/b2", () => ({ uploadFileToB2: mocks.uploadFileToB2 }))

import { POST } from "./+server"

beforeEach(() => {
	vi.clearAllMocks()
	mocks.individualPassphraseDetails.mockReturnValue({
		correct: true,
		position: 12,
	})
	mocks.savePendingBio.mockResolvedValue(undefined)
})

describe("POST /api/bio-submission/submit", () => {
	it("rejects submitter-provided groups without persisting them", async () => {
		const form = new FormData()
		form.set("firstName", "Ada")
		form.set("lastName", "Lovelace")
		form.set("location", "London")
		form.set("email", "ada@example.com")
		form.set("bio", "Mathematician")
		form.set("useOldHeadshot", "true")
		form.set("oldImageSrcPath", "src/images/people/2026/ada.jpg")
		form.set("groups", JSON.stringify(["cast"]))
		const request = new Request(
			"http://example.com/api/bio-submission/submit",
			{
				method: "POST",
				body: form,
			},
		)

		await expect(
			POST({ request } as Parameters<typeof POST>[0]),
		).rejects.toMatchObject({
			status: 400,
			body: { message: "Groups are admin-managed metadata" },
		})
		expect(mocks.savePendingBio).not.toHaveBeenCalled()
		expect(mocks.uploadFileToB2).not.toHaveBeenCalled()
	})
})
