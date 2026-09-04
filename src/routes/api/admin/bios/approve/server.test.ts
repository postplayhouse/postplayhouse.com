import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	individualPassphraseDetails: vi.fn(),
	isAdmin: vi.fn(),
	getPendingBio: vi.fn(),
	approveBio: vi.fn(),
	checkedInGroups: vi.fn(),
	downloadFromB2: vi.fn(),
	uploadBufferToB2: vi.fn(),
	processHeadshotImage: vi.fn(),
	getOptimizedImagePath: vi.fn(),
}))

vi.mock("../../../bio-submission/passphraseHelpers.js", () => ({
	individualPassphraseDetails: mocks.individualPassphraseDetails,
	isAdmin: mocks.isAdmin,
}))
vi.mock("$lib/server/blobs", () => ({
	getPendingBio: mocks.getPendingBio,
	approveBio: mocks.approveBio,
}))
vi.mock("$lib/server/bioMetadata", () => ({
	checkedInGroups: mocks.checkedInGroups,
}))
vi.mock("$lib/server/b2", () => ({
	downloadFromB2: mocks.downloadFromB2,
	uploadBufferToB2: mocks.uploadBufferToB2,
}))
vi.mock("$lib/server/imageProcessing", () => ({
	processHeadshotImage: mocks.processHeadshotImage,
	getOptimizedImagePath: mocks.getOptimizedImagePath,
}))

import { season } from "$data/seasons"
import { POST } from "./+server"

const pending = {
	position: 12,
	firstName: "Original",
	lastName: "Name",
	location: "Old place",
	email: "old@example.com",
	bio: "Old bio",
	originalImageUrl: "originals/2027/original.jpg",
	imageYear: 2027,
	submittedAt: "2026-09-04T00:00:00.000Z",
}

const reviewed = {
	firstName: "Reviewed",
	lastName: "Person",
	location: "New place",
	email: "new@example.com",
	bio: "New bio",
	programBio: "Program bio",
	staffPositions: ["Director"],
	productionPositions: { Hamlet: ["Designer"] },
	roles: { Hamlet: ["Player"] },
}

function request(body: unknown, authorization = "admin") {
	return new Request("http://example.com/api/admin/bios/approve", {
		method: "POST",
		headers: {
			Authorization: authorization,
			"content-type": "application/json",
		},
		body: typeof body === "string" ? body : JSON.stringify(body),
	})
}

async function post(metadata: unknown = {}) {
	return POST({
		request: request({ position: 12, reviewed, metadata }),
	} as Parameters<typeof POST>[0])
}

beforeEach(() => {
	vi.clearAllMocks()
	mocks.individualPassphraseDetails.mockReturnValue({
		correct: true,
		position: 3,
	})
	mocks.isAdmin.mockReturnValue(true)
	mocks.getPendingBio.mockResolvedValue(pending)
	mocks.checkedInGroups.mockReturnValue(["staff"])
	mocks.downloadFromB2.mockResolvedValue(Buffer.from("original"))
	mocks.processHeadshotImage.mockResolvedValue(Buffer.from("optimized"))
	mocks.getOptimizedImagePath.mockReturnValue("optimized/2027/original.jpg")
	mocks.approveBio.mockResolvedValue({ ...pending, ...reviewed })
})

describe("POST /api/admin/bios/approve", () => {
	it("requires admin authentication before validating the body", async () => {
		mocks.individualPassphraseDetails.mockReturnValue({ correct: false })
		await expect(post()).rejects.toMatchObject({ status: 403 })
		expect(mocks.getPendingBio).not.toHaveBeenCalled()

		mocks.individualPassphraseDetails.mockReturnValue({
			correct: true,
			position: 8,
		})
		mocks.isAdmin.mockReturnValue(false)
		await expect(post()).rejects.toMatchObject({ status: 403 })
	})

	it.each([
		["malformed JSON", "{"],
		[
			"unknown immutable field",
			{
				position: 12,
				reviewed: { ...reviewed, imageYear: 2026 },
				metadata: {},
			},
		],
		[
			"unknown group",
			{ position: 12, reviewed, metadata: { groups: ["other"] } },
		],
		[
			"duplicate group",
			{ position: 12, reviewed, metadata: { groups: ["cast", "cast"] } },
		],
	])("rejects %s", async (_label, body) => {
		await expect(
			POST({ request: request(body) } as Parameters<typeof POST>[0]),
		).rejects.toMatchObject({ status: 400 })
		expect(mocks.getPendingBio).not.toHaveBeenCalled()
	})

	it.each([
		["omitted groups preserve YAML", {}, ["staff"]],
		["an empty list clears groups", { groups: [] }, []],
		[
			"a nonempty list replaces groups",
			{ groups: ["cast", "crew"] },
			["cast", "crew"],
		],
	])("%s", async (_label, metadata, expectedGroups) => {
		const response = await post(metadata)
		expect(response.status).toBe(200)
		expect(mocks.approveBio).toHaveBeenCalledWith(
			season,
			12,
			"admin-position-3",
			"optimized/2027/original.jpg",
			reviewed,
			expectedGroups,
		)
		expect(mocks.getOptimizedImagePath).toHaveBeenCalledWith(
			season,
			pending.firstName,
			pending.lastName,
		)
	})
})
