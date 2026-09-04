import { cleanup, fireEvent, render, waitFor } from "@testing-library/svelte"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Page from "./+page.svelte"

const bio = {
	position: 12,
	firstName: "Ada",
	lastName: "Lovelace",
	location: "London",
	email: "ada@example.com",
	bio: "Ada's **full bio**.",
	programBio: "Ada's program bio.",
	staffPositions: ["Engineer"],
	productionPositions: { Hamlet: ["Programmer"] },
	roles: { Hamlet: ["Ada"] },
	originalImageUrl: "originals/2027/ada-lovelace.jpg",
	imageYear: 2027,
	submittedAt: "2026-09-04T12:00:00.000Z",
}

function json(body: unknown, init?: ResponseInit) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "content-type": "application/json" },
		...init,
	})
}

describe("admin bio approvals page", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn())
		Element.prototype.animate = vi.fn().mockReturnValue({
			cancel: vi.fn(),
			onfinish: null,
		})
	})

	afterEach(() => {
		cleanup()
		vi.unstubAllGlobals()
	})

	it("authenticates with a sanitized passphrase and renders the pending record", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(json({ bios: [bio] }))
		const view = render(Page)

		await fireEvent.input(view.getByLabelText("Passphrase"), {
			target: { value: " Admin-Secret 123 " },
		})
		await fireEvent.submit(
			view.getByRole("button", { name: "Load pending bios" }),
		)

		await waitFor(() =>
			expect(view.getByText("1 pending bio")).toBeInTheDocument(),
		)
		expect(fetch).toHaveBeenCalledWith(
			"/api/admin/bios",
			expect.objectContaining({
				headers: expect.objectContaining({}),
			}),
		)
		const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers
		expect(headers.get("Authorization")).toBe("adminsecret")
		expect(view.getByText("ada@example.com")).toBeInTheDocument()
		expect(view.getByText("Ada's program bio.")).toBeInTheDocument()
		expect(view.getByText("Hamlet: Programmer")).toBeInTheDocument()
		const image = view.getByAltText("portrait of Ada Lovelace")
		expect(image).toHaveAttribute(
			"src",
			"/api/admin/bios/image?path=originals%2F2027%2Fada-lovelace.jpg&auth=adminsecret",
		)
	})

	it("shows auth errors and permits retrying", async () => {
		vi.mocked(fetch)
			.mockResolvedValueOnce(
				json({ message: "Admin access required" }, { status: 403 }),
			)
			.mockResolvedValueOnce(json({ bios: [] }))
		const view = render(Page)

		await fireEvent.input(view.getByLabelText("Passphrase"), {
			target: { value: "member" },
		})
		await fireEvent.submit(
			view.getByRole("button", { name: "Load pending bios" }),
		)
		await waitFor(() =>
			expect(view.getByRole("alert")).toHaveTextContent(
				"Admin access required",
			),
		)

		await fireEvent.submit(
			view.getByRole("button", { name: "Load pending bios" }),
		)
		await waitFor(() =>
			expect(view.getByText("There are no pending bios.")).toBeInTheDocument(),
		)
	})

	it("approves a card and displays structured purge results", async () => {
		vi.mocked(fetch)
			.mockResolvedValueOnce(json({ bios: [bio] }))
			.mockResolvedValueOnce(
				json({ success: true, bio, optimizedImageUrl: "optimized.jpg" }),
			)
			.mockResolvedValueOnce(
				json(
					{
						success: false,
						simulated: false,
						purge: { tag: "bios", success: true, status: 202 },
						warming: [{ url: "/who/2027/", success: false, status: 503 }],
					},
					{ status: 502 },
				),
			)
		const view = render(Page)

		await fireEvent.input(view.getByLabelText("Passphrase"), {
			target: { value: "admin" },
		})
		await fireEvent.submit(
			view.getByRole("button", { name: "Load pending bios" }),
		)
		await waitFor(() =>
			expect(view.getByRole("button", { name: "Approve" })).toBeInTheDocument(),
		)
		await fireEvent.click(view.getByRole("button", { name: "Approve" }))
		await waitFor(() =>
			expect(view.getByText("There are no pending bios.")).toBeInTheDocument(),
		)

		const approveCall = vi.mocked(fetch).mock.calls[1]
		expect(approveCall[0]).toBe("/api/admin/bios/approve")
		expect(approveCall[1]?.body).toBe(JSON.stringify({ position: 12 }))
		await fireEvent.click(view.getByRole("button", { name: "Done Approving" }))
		await waitFor(() =>
			expect(view.getByText("Cache update incomplete")).toBeInTheDocument(),
		)
		expect(view.getByText(/Purge tag/)).toHaveTextContent("succeeded")
		expect(view.getByText(/\/who\/2027\//).closest("li")).toHaveTextContent(
			"failed",
		)
	})

	it("confirms rejection, sends the optional reason, and removes a deleted record on a Basecamp failure", async () => {
		vi.mocked(fetch)
			.mockResolvedValueOnce(json({ bios: [bio] }))
			.mockResolvedValueOnce(
				json(
					{ message: "Bio rejected, but Basecamp notification failed" },
					{ status: 502 },
				),
			)
		const view = render(Page)

		await fireEvent.input(view.getByLabelText("Passphrase"), {
			target: { value: "admin" },
		})
		await fireEvent.submit(
			view.getByRole("button", { name: "Load pending bios" }),
		)
		await waitFor(() =>
			expect(view.getByRole("button", { name: "Reject" })).toBeInTheDocument(),
		)
		await fireEvent.click(view.getByRole("button", { name: "Reject" }))

		expect(view.getByRole("dialog")).toHaveTextContent("permanently deletes")
		expect(view.getByRole("dialog")).toHaveTextContent("Basecamp")
		await fireEvent.input(view.getByLabelText("Reason (optional)"), {
			target: { value: "  Please revise.  " },
		})
		await fireEvent.click(
			view.getByRole("button", { name: "Permanently reject" }),
		)

		await waitFor(() =>
			expect(view.getByText("There are no pending bios.")).toBeInTheDocument(),
		)
		expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(
			JSON.stringify({ position: 12, reason: "Please revise." }),
		)
	})
})
