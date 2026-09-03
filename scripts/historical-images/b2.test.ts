// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { B2ArtifactStore } from "./b2"

const credentials = {
	keyId: "key-id",
	applicationKey: "application-key",
	bucketId: "bucket-id",
	storePrefix: "historical-images/v1",
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	})
}

function authorization(
	overrides: Partial<{
		bucketId: string | null
		capabilities: string[]
		namePrefix: string | null
	}> = {},
): Response {
	return json({
		authorizationToken: "account-token",
		apiUrl: "https://api.example.test",
		downloadUrl: "https://download.example.test",
		allowed: {
			bucketId: "bucket-id",
			capabilities: ["listFiles", "readFiles", "writeFiles"],
			namePrefix: null,
			...overrides,
		},
	})
}

afterEach(() => {
	vi.unstubAllGlobals()
	vi.useRealTimers()
})

describe("B2 historical artifact transport", () => {
	it("does not authorize an empty warm-cache inventory", async () => {
		const fetch = vi.fn()
		vi.stubGlobal("fetch", fetch)
		await new B2ArtifactStore(credentials).prime([])
		expect(fetch).not.toHaveBeenCalled()
	})

	it("fails a cold remote read before listing when read permissions are wrong", async () => {
		const fetch = vi
			.fn()
			.mockResolvedValue(
				authorization({ capabilities: ["listFiles"], namePrefix: "other/" }),
			)
		vi.stubGlobal("fetch", fetch)
		await expect(
			new B2ArtifactStore(credentials).get(
				"historical-images/v1/objects/digest",
			),
		).rejects.toThrow(/lacks required capabilities: readFiles/)
		expect(fetch).toHaveBeenCalledTimes(1)
	})

	it("rejects missing capabilities, the wrong bucket, and an incompatible key prefix", async () => {
		for (const [response, expected] of [
			[
				authorization({ capabilities: ["listFiles", "readFiles"] }),
				/lacks required capabilities: writeFiles/,
			],
			[authorization({ bucketId: "other-bucket" }), /configured bucket/],
			[
				authorization({ namePrefix: "bio-submissions/" }),
				/does not permit historical-images\/v1\//,
			],
		] as const) {
			vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response))
			await expect(
				new B2ArtifactStore(credentials).checkPermissions(true),
			).rejects.toThrow(expected)
		}
	})

	it("accepts an ancestor name prefix and downloads only an exact listed name", async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(
				authorization({ namePrefix: "historical-images/" }),
			)
			.mockResolvedValueOnce(
				json({
					files: [
						{
							fileId: "file/id",
							fileName: "historical-images/v1/objects/digest",
						},
					],
				}),
			)
			.mockResolvedValueOnce(new Response("artifact bytes"))
		vi.stubGlobal("fetch", fetch)

		const body = await new B2ArtifactStore(credentials).get(
			"historical-images/v1/objects/digest",
		)

		expect(body).toEqual(Buffer.from("artifact bytes"))
		const listRequest = fetch.mock.calls[1]
		expect(listRequest[0]).toBe(
			"https://api.example.test/b2api/v2/b2_list_file_names",
		)
		expect(JSON.parse(listRequest[1].body)).toEqual({
			bucketId: "bucket-id",
			startFileName: "historical-images/v1/objects/digest",
			maxFileCount: 1,
		})
		expect(fetch.mock.calls[2][0]).toBe(
			"https://download.example.test/b2api/v2/b2_download_file_by_id?fileId=file%2Fid",
		)
	})

	it("treats the next lexicographic object as a miss", async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(authorization())
			.mockResolvedValueOnce(
				json({
					files: [
						{
							fileId: "next-file",
							fileName: "historical-images/v1/objects/digest-next",
						},
					],
				}),
			)
		vi.stubGlobal("fetch", fetch)

		expect(
			await new B2ArtifactStore(credentials).get(
				"historical-images/v1/objects/digest",
			),
		).toBeNull()
		expect(fetch).toHaveBeenCalledTimes(2)
	})

	it("rejects an immutable B2 collision before requesting an upload URL", async () => {
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(authorization())
			.mockResolvedValueOnce(
				json({
					files: [
						{
							fileId: "existing-file",
							fileName: "historical-images/v1/objects/digest",
						},
					],
				}),
			)
			.mockResolvedValueOnce(new Response("different bytes"))
		vi.stubGlobal("fetch", fetch)

		await expect(
			new B2ArtifactStore(credentials).putImmutable(
				"historical-images/v1/objects/digest",
				Buffer.from("expected bytes"),
				"image/jpeg",
			),
		).rejects.toThrow(/Immutable artifact collision/)
		expect(fetch).toHaveBeenCalledTimes(3)
	})

	it("rejects reads and writes outside the historical namespace", async () => {
		const store = new B2ArtifactStore(credentials)
		await expect(store.get("bio-submissions/person.jpg")).rejects.toThrow(
			/outside historical-images\/v1\//,
		)
		await expect(
			store.putPointer("bio-submissions/latest.json", Buffer.from("{}")),
		).rejects.toThrow(/outside historical-images\/v1\//)
	})

	it("retries an explicit transient B2 upload response", async () => {
		vi.useFakeTimers()
		vi.spyOn(Math, "random").mockReturnValue(0.5)
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(authorization())
			.mockResolvedValueOnce(
				json({
					uploadUrl: "https://upload.example.test",
					authorizationToken: "upload-token",
				}),
			)
			.mockResolvedValueOnce(json({ code: "service_unavailable" }, 503))
			.mockResolvedValueOnce(json({ fileId: "created" }))
		vi.stubGlobal("fetch", fetch)

		const publication = new B2ArtifactStore(credentials).putPointer(
			"historical-images/v1/latest.json",
			Buffer.from("{}"),
		)
		await vi.advanceTimersByTimeAsync(250)
		await publication

		expect(fetch).toHaveBeenCalledTimes(4)
		const upload = fetch.mock.calls[2]
		expect(upload[0]).toBe("https://upload.example.test")
		expect(upload[1].headers).toMatchObject({
			Authorization: "upload-token",
			"X-Bz-File-Name": "historical-images/v1/latest.json",
			"Content-Type": "application/json",
		})
	})

	it("retries thrown network failures and honors Retry-After", async () => {
		vi.useFakeTimers()
		vi.spyOn(Math, "random").mockReturnValue(0.5)
		const fetch = vi
			.fn()
			.mockRejectedValueOnce(new TypeError("network reset"))
			.mockResolvedValueOnce(
				new Response("busy", { status: 429, headers: { "Retry-After": "2" } }),
			)
			.mockResolvedValueOnce(authorization())
		vi.stubGlobal("fetch", fetch)

		const permissions = new B2ArtifactStore(credentials).checkPermissions(false)
		await vi.advanceTimersByTimeAsync(250)
		await vi.advanceTimersByTimeAsync(2_250)
		await permissions
		expect(fetch).toHaveBeenCalledTimes(3)
	})

	it("bounds retries for timeout failures", async () => {
		vi.useFakeTimers()
		vi.spyOn(Math, "random").mockReturnValue(0.5)
		const timeout = new Error("timed out")
		timeout.name = "TimeoutError"
		const fetch = vi
			.fn()
			.mockRejectedValueOnce(timeout)
			.mockResolvedValueOnce(authorization())
		vi.stubGlobal("fetch", fetch)
		const permissions = new B2ArtifactStore(credentials).checkPermissions(false)
		await vi.advanceTimersByTimeAsync(250)
		await permissions
		expect(fetch).toHaveBeenCalledTimes(2)
	})

	it("lists an object range once before parallel downloads", async () => {
		const files = ["a", "b"].map((suffix) => ({
			fileId: `id-${suffix}`,
			fileName: `historical-images/v1/objects/${suffix}`,
		}))
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(authorization())
			.mockResolvedValueOnce(json({ files, nextFileName: null }))
			.mockResolvedValueOnce(new Response("a"))
			.mockResolvedValueOnce(new Response("b"))
		vi.stubGlobal("fetch", fetch)
		const store = new B2ArtifactStore(credentials)
		await store.prime(files.map(({ fileName }) => fileName))
		expect(await store.get(files[0].fileName)).toEqual(Buffer.from("a"))
		expect(await store.get(files[1].fileName)).toEqual(Buffer.from("b"))
		expect(
			fetch.mock.calls.filter(([url]) =>
				String(url).includes("b2_list_file_names"),
			),
		).toHaveLength(1)
	})

	it("reuses listed objects by server length and SHA-1 without downloading them", async () => {
		const body = Buffer.from("verified local artifact")
		const name = "historical-images/v1/objects/digest"
		const contentSha1 = await import("node:crypto").then(({ createHash }) =>
			createHash("sha1").update(body).digest("hex"),
		)
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(authorization())
			.mockResolvedValueOnce(
				json({
					files: [
						{
							fileId: "existing-id",
							fileName: name,
							contentLength: body.length,
							contentSha1,
						},
					],
				}),
			)
		vi.stubGlobal("fetch", fetch)
		const store = new B2ArtifactStore(credentials)
		await store.prime([name])
		expect(await store.putImmutable(name, body, "image/jpeg")).toBe("exists")
		expect(fetch).toHaveBeenCalledTimes(2)
	})

	it("still performs an exact lookup for a name not covered by priming", async () => {
		const primed = "historical-images/v1/objects/a"
		const unprimed = "historical-images/v1/objects/z"
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(authorization())
			.mockResolvedValueOnce(json({ files: [], nextFileName: null }))
			.mockResolvedValueOnce(
				json({ files: [{ fileId: "z-id", fileName: unprimed }] }),
			)
			.mockResolvedValueOnce(new Response("z"))
		vi.stubGlobal("fetch", fetch)
		const store = new B2ArtifactStore(credentials)
		await store.prime([primed])
		expect(await store.get(unprimed)).toEqual(Buffer.from("z"))
		expect(
			fetch.mock.calls.filter(([url]) =>
				String(url).includes("b2_list_file_names"),
			),
		).toHaveLength(2)
	})

	it("reauthorizes once when an account token expires", async () => {
		const name = "historical-images/v1/objects/digest"
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(authorization())
			.mockResolvedValueOnce(new Response("expired", { status: 401 }))
			.mockResolvedValueOnce(authorization())
			.mockResolvedValueOnce(
				json({ files: [{ fileId: "fresh-id", fileName: name }] }),
			)
			.mockResolvedValueOnce(new Response("artifact"))
		vi.stubGlobal("fetch", fetch)
		expect(await new B2ArtifactStore(credentials).get(name)).toEqual(
			Buffer.from("artifact"),
		)
		expect(
			fetch.mock.calls.filter(([url]) =>
				String(url).includes("authorize_account"),
			),
		).toHaveLength(2)
	})
})
