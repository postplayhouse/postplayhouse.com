import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	individualPassphraseDetails: vi.fn(),
	isAdmin: vi.fn(),
	getPendingBio: vi.fn(),
	deletePendingBio: vi.fn(),
	sendMessageToChatRoom: vi.fn(),
}))

vi.mock("../../../bio-submission/passphraseHelpers.js", () => ({
	individualPassphraseDetails: mocks.individualPassphraseDetails,
	isAdmin: mocks.isAdmin,
}))

vi.mock("$lib/server/blobs", () => ({
	getPendingBio: mocks.getPendingBio,
	deletePendingBio: mocks.deletePendingBio,
}))

vi.mock("../../../basecamp.server", () => ({
	sendMessageToChatRoom: mocks.sendMessageToChatRoom,
}))

import { POST } from "./+server"

const pendingBio = {
	position: 12,
	firstName: "Pat",
	lastName: "Player",
	email: "pat@example.com",
}

function request(body: unknown = { position: 12, reason: "Please revise it" }) {
	return new Request("http://example.com/api/admin/bios/reject", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	})
}

async function post(body?: unknown) {
	return POST({ request: request(body), fetch } as Parameters<typeof POST>[0])
}

beforeEach(() => {
	vi.clearAllMocks()
	mocks.individualPassphraseDetails.mockReturnValue({
		correct: true,
		position: 3,
	})
	mocks.isAdmin.mockReturnValue(true)
	mocks.getPendingBio.mockResolvedValue(pendingBio)
	mocks.deletePendingBio.mockResolvedValue(undefined)
	mocks.sendMessageToChatRoom.mockResolvedValue(
		new Response(null, { status: 201 }),
	)
})

describe("POST /api/admin/bios/reject", () => {
	it("requires a valid admin passphrase", async () => {
		mocks.individualPassphraseDetails.mockReturnValue({ correct: false })
		await expect(post()).rejects.toMatchObject({
			status: 403,
			body: { message: "Invalid passphrase" },
		})

		mocks.individualPassphraseDetails.mockReturnValue({
			correct: true,
			position: 8,
		})
		mocks.isAdmin.mockReturnValue(false)
		await expect(post()).rejects.toMatchObject({
			status: 403,
			body: { message: "Admin access required" },
		})
	})

	it.each([
		["malformed JSON", "{"],
		["missing position", {}],
		["non-integer position", { position: 1.5 }],
		["non-positive position", { position: 0 }],
		["non-string reason", { position: 12, reason: 4 }],
	])("rejects %s", async (_description, body) => {
		await expect(post(body)).rejects.toMatchObject({ status: 400 })
		expect(mocks.getPendingBio).not.toHaveBeenCalled()
	})

	it("returns 404 when the current-season pending bio does not exist", async () => {
		mocks.getPendingBio.mockResolvedValue(null)
		await expect(post()).rejects.toMatchObject({
			status: 404,
			body: { message: "Pending bio not found" },
		})
		expect(mocks.deletePendingBio).not.toHaveBeenCalled()
	})

	it("returns clear Blob read and delete failures", async () => {
		mocks.getPendingBio.mockRejectedValueOnce(new Error("read unavailable"))
		await expect(post()).rejects.toMatchObject({
			status: 500,
			body: { message: "Failed to fetch pending bio" },
		})

		mocks.deletePendingBio.mockRejectedValueOnce(
			new Error("delete unavailable"),
		)
		await expect(post()).rejects.toMatchObject({
			status: 500,
			body: { message: "Failed to delete pending bio" },
		})
		expect(mocks.sendMessageToChatRoom).not.toHaveBeenCalled()
	})

	it("deletes before notifying Basecamp and identifies both people", async () => {
		const order: string[] = []
		mocks.deletePendingBio.mockImplementation(async () => {
			order.push("delete")
		})
		mocks.sendMessageToChatRoom.mockImplementation(async () => {
			order.push("notify")
			return new Response(null, { status: 201 })
		})

		const response = await post()

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ success: true })
		expect(order).toEqual(["delete", "notify"])
		expect(mocks.sendMessageToChatRoom).toHaveBeenCalledWith(
			expect.any(Function),
			"admin",
			expect.stringContaining("Admin position 3"),
		)
		const message = mocks.sendMessageToChatRoom.mock.calls[0][2]
		expect(message).toContain("Pat Player (position 12, pat@example.com)")
		expect(message).toContain(
			"Discussion about this rejection belongs in Basecamp.",
		)
		expect(message).toContain("Reason: Please revise it")
	})

	it("retains no rejected record when Basecamp notification fails", async () => {
		mocks.sendMessageToChatRoom.mockResolvedValue(
			new Response(null, { status: 503 }),
		)

		await expect(post()).rejects.toMatchObject({
			status: 502,
			body: { message: "Bio rejected, but Basecamp notification failed" },
		})
		expect(mocks.deletePendingBio).toHaveBeenCalledOnce()
		expect(mocks.sendMessageToChatRoom).toHaveBeenCalledOnce()
	})

	it("succeeds when the non-production Basecamp helper performs no write", async () => {
		mocks.sendMessageToChatRoom.mockResolvedValue(undefined)
		const response = await post({ position: 12 })

		expect(response.status).toBe(200)
		expect(mocks.deletePendingBio).toHaveBeenCalledOnce()
		const message = mocks.sendMessageToChatRoom.mock.calls[0][2]
		expect(message).not.toContain("Reason:")
	})
})
