import { beforeEach, describe, expect, it, vi } from "vitest"

const privateEnv = vi.hoisted(() => ({
	CONTEXT: "deploy-preview" as string | undefined,
	PLAYWRIGHT_TEST: "false",
}))

const requestHeaders = vi.hoisted(() => new Headers())

const netlifyBlobs = vi.hoisted(() => {
	function createStore() {
		return {
			setJSON: vi.fn(async () => {}),
			get: vi.fn(),
			delete: vi.fn(async () => {}),
			list: vi.fn(),
		}
	}

	const persistentStore = createStore()
	const deployStore = createStore()

	return {
		persistentStore,
		deployStore,
		getStore: vi.fn(() => persistentStore),
		getDeployStore: vi.fn(() => deployStore),
	}
})

vi.mock("$env/dynamic/private", () => ({ env: privateEnv }))
vi.mock("$app/server", () => ({
	getRequestEvent: () => ({ request: { headers: requestHeaders } }),
}))
vi.mock("@netlify/blobs", () => ({
	getStore: netlifyBlobs.getStore,
	getDeployStore: netlifyBlobs.getDeployStore,
}))

import {
	approveBio,
	deletePendingBio,
	getApprovedBio,
	getPendingBio,
	listApprovedBios,
	listPendingBios,
	savePendingBio,
	approvedBioSchema,
	pendingBioSchema,
	type PendingBio,
} from "./blobs"

const bio: PendingBio = {
	position: 7,
	firstName: "Ada",
	lastName: "Lovelace",
	location: "London",
	email: "ada@example.com",
	bio: "Mathematician",
	originalImageUrl: "https://example.com/ada.jpg",
	imageYear: 2027,
	submittedAt: "2026-09-04T00:00:00.000Z",
}

const reviewed = {
	firstName: bio.firstName,
	lastName: bio.lastName,
	location: bio.location,
	email: bio.email,
	bio: bio.bio,
}

async function exerciseEveryOperation(
	store: typeof netlifyBlobs.persistentStore,
) {
	store.get.mockImplementation(async (key: string) =>
		key.includes("/pending/") ? bio : { ...bio, approvedBy: "admin" },
	)
	store.list.mockImplementation(async ({ prefix }: { prefix: string }) => ({
		blobs: [{ key: `${prefix}7` }],
	}))

	await savePendingBio(2027, bio)
	await getPendingBio(2027, 7)
	await deletePendingBio(2027, 7)
	await listPendingBios(2027)
	await approveBio(
		2027,
		7,
		"admin",
		"https://example.com/optimized.jpg",
		reviewed,
		["staff"],
	)
	await getApprovedBio(2027, 7)
	await listApprovedBios(2027)

	expect(store.setJSON).toHaveBeenCalledWith("2027/pending/7", bio)
	expect(store.setJSON).toHaveBeenCalledWith(
		"2027/approved/7",
		expect.objectContaining({
			...bio,
			approvedBy: "admin",
			optimizedImageUrl: "https://example.com/optimized.jpg",
			groups: ["staff"],
		}),
	)
	expect(store.get).toHaveBeenCalledWith("2027/pending/7", { type: "json" })
	expect(store.get).toHaveBeenCalledWith("2027/approved/7", { type: "json" })
	expect(store.delete).toHaveBeenCalledWith("2027/pending/7")
	expect(store.list).toHaveBeenCalledWith({ prefix: "2027/pending/" })
	expect(store.list).toHaveBeenCalledWith({ prefix: "2027/approved/" })
}

function expectStoreUnused(store: typeof netlifyBlobs.persistentStore) {
	expect(store.setJSON).not.toHaveBeenCalled()
	expect(store.get).not.toHaveBeenCalled()
	expect(store.delete).not.toHaveBeenCalled()
	expect(store.list).not.toHaveBeenCalled()
}

describe("pending bios Blob store isolation", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		privateEnv.PLAYWRIGHT_TEST = "false"
		requestHeaders.delete("x-nf-deploy-id")
	})

	it("uses the persistent store for every operation in production", async () => {
		privateEnv.CONTEXT = "production"

		await exerciseEveryOperation(netlifyBlobs.persistentStore)

		expect(netlifyBlobs.getStore).toHaveBeenCalledWith("pending-bios")
		expect(netlifyBlobs.getDeployStore).not.toHaveBeenCalled()
		expectStoreUnused(netlifyBlobs.deployStore)
	})

	it.each([
		["local development", undefined, "false"],
		["tests", "test", "false"],
		["deploy previews", "deploy-preview", "false"],
		["branch deploys", "branch-deploy", "false"],
		["Playwright", "production", "true"],
	])(
		"uses the deploy store for every operation in %s",
		async (_name, context, playwrightTest) => {
			privateEnv.CONTEXT = context
			privateEnv.PLAYWRIGHT_TEST = playwrightTest

			await exerciseEveryOperation(netlifyBlobs.deployStore)

			expect(netlifyBlobs.getDeployStore).toHaveBeenCalledWith("pending-bios")
			expect(netlifyBlobs.getStore).not.toHaveBeenCalled()
			expectStoreUnused(netlifyBlobs.persistentStore)
		},
	)

	it("binds hosted non-production data to the request deploy", async () => {
		privateEnv.CONTEXT = "deploy-preview"
		requestHeaders.set("x-nf-deploy-id", "preview-deploy-id")

		await exerciseEveryOperation(netlifyBlobs.deployStore)

		expect(netlifyBlobs.getDeployStore).toHaveBeenCalledWith("pending-bios", {
			deployID: "preview-deploy-id",
		})
		expect(netlifyBlobs.getStore).not.toHaveBeenCalled()
		expectStoreUnused(netlifyBlobs.persistentStore)
	})
})

describe("pending and approved bio compatibility", () => {
	it("rejects admin metadata from pending records", () => {
		expect(
			pendingBioSchema.safeParse({ ...bio, groups: ["cast"] }).success,
		).toBe(false)
	})

	it("reads both legacy and group-aware approved records", () => {
		expect(approvedBioSchema.parse(bio).groups).toBeUndefined()
		expect(approvedBioSchema.parse({ ...bio, groups: [] }).groups).toEqual([])
	})

	it("reads legacy pending records without exposing approval metadata", async () => {
		privateEnv.CONTEXT = "deploy-preview"
		netlifyBlobs.deployStore.get.mockResolvedValue({
			...bio,
			optimizedImageUrl: "legacy-optimized.jpg",
			approvedAt: "2026-09-05T00:00:00.000Z",
			approvedBy: "legacy-admin",
		})

		await expect(getPendingBio(2027, 7)).resolves.toEqual(bio)
	})

	it("persists reviewed content while retaining pending record identity", async () => {
		vi.clearAllMocks()
		privateEnv.CONTEXT = "deploy-preview"
		netlifyBlobs.deployStore.get.mockResolvedValue(bio)
		const revised = {
			...reviewed,
			firstName: "Augusta",
			bio: "Reviewed biography",
		}

		await approveBio(
			2027,
			7,
			"admin-position-3",
			"optimized/2027/ada.jpg",
			revised,
			[],
		)

		expect(netlifyBlobs.deployStore.setJSON).toHaveBeenCalledWith(
			"2027/approved/7",
			expect.objectContaining({
				...revised,
				position: bio.position,
				originalImageUrl: bio.originalImageUrl,
				imageYear: bio.imageYear,
				submittedAt: bio.submittedAt,
				approvedBy: "admin-position-3",
				groups: [],
			}),
		)
	})
})
