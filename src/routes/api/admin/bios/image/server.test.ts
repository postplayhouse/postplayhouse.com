import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	downloadFromB2: vi.fn(),
}))

vi.mock("$lib/server/b2", () => ({ downloadFromB2: mocks.downloadFromB2 }))
vi.mock("../../../bio-submission/passphraseHelpers", () => ({
	individualPassphraseDetails(request: Request) {
		const credential = request.headers.get("Authorization")
		if (credential === "admin") return { correct: true, position: 2 }
		if (credential === "member") return { correct: true, position: 3 }
		return { correct: false }
	},
	isAdmin(position: number) {
		return position === 2
	},
}))

import { GET } from "./+server"

function request(
	path: string | undefined,
	options: { authorization?: string; queryAuth?: string } = {},
) {
	const url = new URL("https://example.com/api/admin/bios/image")
	if (path !== undefined) url.searchParams.set("path", path)
	if (options.queryAuth !== undefined)
		url.searchParams.set("auth", options.queryAuth)

	const req = new Request(url, {
		headers: options.authorization
			? { Authorization: options.authorization }
			: undefined,
	})
	return GET({ request: req, url } as Parameters<typeof GET>[0])
}

describe("GET /api/admin/bios/image", () => {
	beforeEach(() => {
		mocks.downloadFromB2.mockReset()
	})

	test("serves B2 image bytes to an admin authenticated by header", async () => {
		mocks.downloadFromB2.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff]))

		const response = await request("originals/2027/jane-doe.jpg", {
			authorization: "admin",
		})

		expect(response.status).toBe(200)
		expect(response.headers.get("Content-Type")).toBe("image/jpeg")
		expect(response.headers.get("Cache-Control")).toBe("private, no-store")
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(
			new Uint8Array([0xff, 0xd8, 0xff]),
		)
		expect(mocks.downloadFromB2).toHaveBeenCalledWith(
			"originals/2027/jane-doe.jpg",
		)
	})

	test.each([
		["optimized/2027/jane-doe.jpg", "image/jpeg"],
		["originals/2027/jane-doe.heif", "image/heif"],
	])("serves supported B2 path %s", async (path, contentType) => {
		mocks.downloadFromB2.mockResolvedValue(Buffer.from([0x00, 0x00, 0x00]))

		const response = await request(path, { authorization: "admin" })

		expect(response.status).toBe(200)
		expect(response.headers.get("Content-Type")).toBe(contentType)
		expect(mocks.downloadFromB2).toHaveBeenCalledWith(path)
	})

	test("accepts query authentication and serves approved local headshots", async () => {
		const response = await request("src/images/people/2015/ellen-feldges.jpg", {
			queryAuth: "admin",
		})

		expect(response.status).toBe(200)
		expect(response.headers.get("Content-Type")).toBe("image/jpeg")
		expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0)
	})

	test.each([
		["missing authentication", {}],
		["invalid authentication", { authorization: "invalid" }],
		["non-admin authentication", { authorization: "member" }],
	])("rejects %s", async (_description, options) => {
		await expect(
			request("optimized/2027/jane-doe.jpg", options),
		).rejects.toMatchObject({ status: 403 })
	})

	test("does not use query authentication when an Authorization header is present", async () => {
		await expect(
			request("optimized/2027/jane-doe.jpg", {
				authorization: "invalid",
				queryAuth: "admin",
			}),
		).rejects.toMatchObject({ status: 403 })
	})

	test.each([
		"originals/2027/../secret.jpg",
		"other/2027/jane-doe.jpg",
		"https://example.com/image.jpg",
		"src/images/../secrets.jpg",
		"src/images/sponsors/logo.png",
		"/etc/passwd",
	])("rejects unsafe or unsupported path %s", async (path) => {
		await expect(
			request(path, { authorization: "admin" }),
		).rejects.toMatchObject({ status: 400 })
	})

	test("requires an image path", async () => {
		await expect(
			request(undefined, { authorization: "admin" }),
		).rejects.toMatchObject({ status: 400 })
	})
})
