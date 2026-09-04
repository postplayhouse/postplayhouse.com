import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	individualPassphraseDetails: vi.fn(),
	isAdmin: vi.fn(),
	listApprovedBios: vi.fn(),
	downloadFromB2: vi.fn(),
	getCheckedInPeopleYaml: vi.fn(),
	serializeApprovedBios: vi.fn(),
	createBiosExportZip: vi.fn(),
}))

vi.mock("../../bio-submission/passphraseHelpers", () => ({
	individualPassphraseDetails: mocks.individualPassphraseDetails,
	isAdmin: mocks.isAdmin,
}))
vi.mock("$lib/server/blobs", () => ({
	listApprovedBios: mocks.listApprovedBios,
}))
vi.mock("$lib/server/b2", () => ({
	downloadFromB2: mocks.downloadFromB2,
}))
vi.mock("$lib/server/biosExport", async (importOriginal) => ({
	...(await importOriginal<typeof import("$lib/server/biosExport")>()),
	getCheckedInPeopleYaml: mocks.getCheckedInPeopleYaml,
	serializeApprovedBios: mocks.serializeApprovedBios,
	createBiosExportZip: mocks.createBiosExportZip,
}))

import { BiosExportError } from "$lib/server/biosExport"
import { GET } from "./+server"

function request(year = "2027") {
	const url = new URL("http://example.com/api/admin/export-bios")
	if (year) url.searchParams.set("year", year)
	return {
		request: new Request(url, { headers: { Authorization: "admin" } }),
		url,
	} as Parameters<typeof GET>[0]
}

beforeEach(() => {
	vi.clearAllMocks()
	vi.spyOn(console, "error").mockImplementation(() => undefined)
	mocks.individualPassphraseDetails.mockReturnValue({
		correct: true,
		position: 3,
	})
	mocks.isAdmin.mockReturnValue(true)
	mocks.getCheckedInPeopleYaml.mockReturnValue("checked-in yaml")
	mocks.listApprovedBios.mockResolvedValue([{ position: 1 }])
	mocks.serializeApprovedBios.mockReturnValue({
		yaml: "exported yaml",
		images: [
			{
				b2Path: "optimized/2027/person.jpg",
				archivePath: "src/images/people/2027/person.jpg",
			},
		],
	})
	mocks.downloadFromB2.mockResolvedValue(Buffer.from("image"))
	mocks.createBiosExportZip.mockResolvedValue(Uint8Array.from([80, 75]))
})

describe("GET /api/admin/export-bios", () => {
	it("authenticates before validating the year or accessing storage", async () => {
		mocks.individualPassphraseDetails.mockReturnValue({ correct: false })
		await expect(GET(request("not-a-year"))).rejects.toMatchObject({
			status: 403,
		})
		expect(mocks.getCheckedInPeopleYaml).not.toHaveBeenCalled()
		expect(mocks.listApprovedBios).not.toHaveBeenCalled()
		expect(mocks.downloadFromB2).not.toHaveBeenCalled()

		mocks.individualPassphraseDetails.mockReturnValue({
			correct: true,
			position: 8,
		})
		mocks.isAdmin.mockReturnValue(false)
		await expect(GET(request())).rejects.toMatchObject({ status: 403 })
	})

	it.each(["", "202", "2028", "not-a-year"])(
		"rejects unsupported year %j before storage access",
		async (year) => {
			await expect(GET(request(year))).rejects.toMatchObject({ status: 400 })
			expect(mocks.getCheckedInPeopleYaml).not.toHaveBeenCalled()
			expect(mocks.listApprovedBios).not.toHaveBeenCalled()
			expect(mocks.downloadFromB2).not.toHaveBeenCalled()
		},
	)

	it("returns 404 when checked-in YAML is unavailable", async () => {
		mocks.getCheckedInPeopleYaml.mockReturnValue(undefined)
		await expect(GET(request())).rejects.toMatchObject({ status: 404 })
		expect(mocks.listApprovedBios).not.toHaveBeenCalled()
	})

	it("returns 404 when there are no approved records", async () => {
		mocks.listApprovedBios.mockResolvedValue([])
		await expect(GET(request())).rejects.toMatchObject({ status: 404 })
		expect(mocks.serializeApprovedBios).not.toHaveBeenCalled()
		expect(mocks.downloadFromB2).not.toHaveBeenCalled()
	})

	it("returns 500 for Blob failures", async () => {
		mocks.listApprovedBios.mockRejectedValue(new Error("Blobs unavailable"))
		await expect(GET(request())).rejects.toMatchObject({ status: 500 })
		expect(mocks.downloadFromB2).not.toHaveBeenCalled()
	})

	it("returns validation failures before B2 access", async () => {
		mocks.serializeApprovedBios.mockImplementation(() => {
			throw new BiosExportError("Missing optimized image", 422)
		})
		await expect(GET(request())).rejects.toMatchObject({ status: 422 })
		expect(mocks.downloadFromB2).not.toHaveBeenCalled()
	})

	it("returns 502 and never creates a partial ZIP when B2 fails", async () => {
		mocks.downloadFromB2.mockRejectedValue(new Error("B2 unavailable"))
		await expect(GET(request())).rejects.toMatchObject({ status: 502 })
		expect(mocks.createBiosExportZip).not.toHaveBeenCalled()
	})

	it("returns the deterministic ZIP with download headers", async () => {
		const response = await GET(request())
		expect(response.status).toBe(200)
		expect(response.headers.get("content-type")).toBe("application/zip")
		expect(response.headers.get("content-disposition")).toBe(
			'attachment; filename="bios-2027.zip"',
		)
		expect(response.headers.get("cache-control")).toBe("private, no-store")
		expect(mocks.listApprovedBios).toHaveBeenCalledWith(2027)
		expect(mocks.downloadFromB2).toHaveBeenCalledWith(
			"optimized/2027/person.jpg",
		)
		expect(mocks.createBiosExportZip).toHaveBeenCalledWith(
			"2027",
			"exported yaml",
			[
				{
					b2Path: "optimized/2027/person.jpg",
					archivePath: "src/images/people/2027/person.jpg",
					content: Buffer.from("image"),
				},
			],
		)
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(
			Uint8Array.from([80, 75]),
		)
	})
})
