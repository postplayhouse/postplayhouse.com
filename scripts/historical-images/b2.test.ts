// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { B2ArtifactStore } from "./b2"

const credentials = {
	keyId: "key-id",
	applicationKey: "application-key",
	bucketId: "bucket-id",
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
})
