import { beforeEach, describe, expect, it, vi } from "vitest"

const privateEnv = vi.hoisted(() => ({
	CONTEXT: "deploy-preview" as string | undefined,
	PLAYWRIGHT_TEST: "false",
}))

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
	await approveBio(2027, 7, "admin", "https://example.com/optimized.jpg")
	await getApprovedBio(2027, 7)
	await listApprovedBios(2027)

	expect(store.setJSON).toHaveBeenCalledWith("2027/pending/7", bio)
	expect(store.setJSON).toHaveBeenCalledWith(
		"2027/approved/7",
		expect.objectContaining({
			...bio,
			approvedBy: "admin",
			optimizedImageUrl: "https://example.com/optimized.jpg",
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
})
