// @vitest-environment node
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { c as createTar, x as extractTar } from "tar"
import {
	CACHE_RELATIVE_PATH,
	createArchive,
	deriveHashes,
	installCache,
	isSafeArchivePath,
	sha256,
	validatePointer,
	verifyAndExtractArchive,
	type CacheIdentity,
	type CachePointer,
} from "./cache"
import { publish, restore } from "./index"

const temporary: string[] = []

function temp(): string {
	const path = mkdtempSync(join(tmpdir(), "enhanced-image-cache-test-"))
	temporary.push(path)
	return path
}

function identity(): CacheIdentity {
	const compatibility: CacheIdentity["compatibility"] = {
		packages: {
			"@sveltejs/enhanced-img": "0.8.4",
			"vite-imagetools": "8.0.0",
			"imagetools-core": "8.0.0",
			sharp: "0.34.5",
		},
		libvips: "8.17.3",
		nodeMajor: 24,
		platform: "linux",
		arch: "x64",
		lockfile: { path: "pnpm-lock.yaml", size: 4, sha256: sha256("lock") },
		configuration: [
			{ path: "vite.config.ts", size: 6, sha256: sha256("config") },
		],
	}
	const sources = [{ path: "src/image.jpg", size: 5, sha256: sha256("image") }]
	return { ...deriveHashes(compatibility, sources), compatibility, sources }
}

afterEach(() => {
	vi.unstubAllGlobals()
	vi.unstubAllEnvs()
	for (const path of temporary.splice(0))
		rmSync(path, { recursive: true, force: true })
})

describe("cache identity", () => {
	it("is deterministic and changes with compatibility or source content", () => {
		const first = identity()
		const reordered = {
			...first.compatibility,
			packages: Object.fromEntries(
				Object.entries(first.compatibility.packages).reverse(),
			),
		}
		expect(deriveHashes(reordered, first.sources)).toEqual({
			compatibilityHash: first.compatibilityHash,
			sourceSetHash: first.sourceSetHash,
		})
		expect(
			deriveHashes(first.compatibility, [
				{ ...first.sources[0], sha256: sha256("different") },
			]).sourceSetHash,
		).not.toBe(first.sourceSetHash)
	})

	it("rejects incompatible pointers", () => {
		const current = identity()
		const pointer: CachePointer = {
			formatVersion: 1,
			compatibilityHash: current.compatibilityHash,
			sourceSetHash: "wrong",
			archiveName: "cache/enhanced-image/v1/wrong/archive.tar.gz",
			archiveSha256: "a".repeat(64),
			archiveSize: 1,
			createdAt: new Date(0).toISOString(),
		}
		expect(() => validatePointer(pointer, current)).toThrow(
			/invalid or incompatible/,
		)
	})
})

describe("archive safety and integrity", () => {
	it("round-trips a manifest and installs only verified cache files", async () => {
		const root = temp()
		const cache = join(root, CACHE_RELATIVE_PATH)
		mkdirSync(cache, { recursive: true })
		writeFileSync(join(cache, "0123456789abcdef"), "transformed image")
		const archive = join(temp(), "cache.tar.gz")
		const current = identity()
		await createArchive(root, archive, current, "abc123")

		const extracted = temp()
		const manifest = await verifyAndExtractArchive(archive, extracted, current)
		expect(manifest.files).toHaveLength(1)
		const destination = temp()
		installCache(destination, extracted)
		expect(
			readFileSync(
				join(destination, CACHE_RELATIVE_PATH, "0123456789abcdef"),
				"utf8",
			),
		).toBe("transformed image")
	})

	it("rejects a cache file whose per-file hash does not match", async () => {
		const root = temp()
		const cache = join(root, CACHE_RELATIVE_PATH)
		mkdirSync(cache, { recursive: true })
		writeFileSync(join(cache, "cached"), "valid")
		const archive = join(temp(), "valid.tar.gz")
		const current = identity()
		await createArchive(root, archive, current, null)

		const stage = temp()
		await extractTar({ file: archive, cwd: stage })
		writeFileSync(join(stage, CACHE_RELATIVE_PATH, "cached"), "corrupt")
		const corrupt = join(temp(), "corrupt.tar.gz")
		await createTar({ file: corrupt, cwd: stage, gzip: true }, [
			"manifest.json",
			CACHE_RELATIVE_PATH,
		])
		await expect(
			verifyAndExtractArchive(corrupt, temp(), current),
		).rejects.toThrow(/integrity verification failed/)
	})

	it("rejects traversal paths and non-file tar entries", async () => {
		expect(isSafeArchivePath("../../etc/passwd")).toBe(false)
		expect(isSafeArchivePath("/etc/passwd")).toBe(false)
		expect(isSafeArchivePath("node_modules/.cache/imagetools/good")).toBe(true)

		const stage = temp()
		mkdirSync(join(stage, CACHE_RELATIVE_PATH), { recursive: true })
		writeFileSync(join(stage, "manifest.json"), "{}")
		symlinkSync("manifest.json", join(stage, CACHE_RELATIVE_PATH, "link"))
		const archive = join(temp(), "symlink.tar.gz")
		await createTar({ file: archive, cwd: stage, gzip: true }, [
			"manifest.json",
			CACHE_RELATIVE_PATH,
		])
		await expect(
			verifyAndExtractArchive(archive, temp(), identity()),
		).rejects.toThrow(/Unsafe archive entry type/)
	})
})

describe("cold fallback", () => {
	it("does not fall back to the general B2 credentials", async () => {
		vi.stubEnv("B2_CACHE_READ_APPLICATION_KEY_ID", "")
		vi.stubEnv("B2_CACHE_READ_APPLICATION_KEY", "")
		vi.stubEnv("B2_APPLICATION_KEY_ID", "unrelated-id")
		vi.stubEnv("B2_APPLICATION_KEY", "unrelated-key")
		await expect(restore(temp())).resolves.toBe(false)
	})

	it("preserves the local cache when B2 is unavailable", async () => {
		const root = temp()
		for (const [name, version] of Object.entries(
			identity().compatibility.packages,
		)) {
			const packageDirectory = join(root, "node_modules", ...name.split("/"))
			mkdirSync(packageDirectory, { recursive: true })
			writeFileSync(
				join(packageDirectory, "package.json"),
				JSON.stringify({ name, version }),
			)
		}
		mkdirSync(join(root, "src"), { recursive: true })
		writeFileSync(join(root, "pnpm-lock.yaml"), "lock")
		writeFileSync(join(root, "vite.config.ts"), "enhancedImages()")
		writeFileSync(join(root, "src", "image.jpg"), "image")
		const cache = join(root, CACHE_RELATIVE_PATH)
		mkdirSync(cache, { recursive: true })
		writeFileSync(join(cache, "existing"), "keep me")
		vi.stubEnv("B2_CACHE_READ_APPLICATION_KEY_ID", "fixture-id")
		vi.stubEnv("B2_CACHE_READ_APPLICATION_KEY", "fixture-key")
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("network unavailable")),
		)

		await expect(restore(root)).resolves.toBe(false)
		expect(readFileSync(join(cache, "existing"), "utf8")).toBe("keep me")
	})
})

describe("publishing", () => {
	it("requires the separate write credential context", async () => {
		vi.stubEnv("B2_CACHE_WRITE_APPLICATION_KEY_ID", "")
		vi.stubEnv("B2_CACHE_WRITE_APPLICATION_KEY", "")
		vi.stubEnv("B2_APPLICATION_KEY_ID", "unrelated-id")
		vi.stubEnv("B2_APPLICATION_KEY", "unrelated-key")
		vi.stubEnv("B2_BUCKET_ID", "fixture-bucket")
		await expect(publish(temp())).rejects.toThrow(
			/B2_CACHE_WRITE_APPLICATION_KEY_ID/,
		)
	})

	it("uploads the immutable archive before updating the pointer", async () => {
		const root = temp()
		for (const [name, version] of Object.entries(
			identity().compatibility.packages,
		)) {
			const packageDirectory = join(root, "node_modules", ...name.split("/"))
			mkdirSync(packageDirectory, { recursive: true })
			writeFileSync(
				join(packageDirectory, "package.json"),
				JSON.stringify({ name, version }),
			)
		}
		mkdirSync(join(root, "src"), { recursive: true })
		writeFileSync(join(root, "pnpm-lock.yaml"), "lock")
		writeFileSync(join(root, "vite.config.ts"), "enhancedImages()")
		writeFileSync(join(root, "src", "image.jpg"), "image")
		mkdirSync(join(root, CACHE_RELATIVE_PATH), { recursive: true })
		writeFileSync(join(root, CACHE_RELATIVE_PATH, "cached"), "transformed")
		vi.stubEnv("B2_CACHE_WRITE_APPLICATION_KEY_ID", "fixture-id")
		vi.stubEnv("B2_CACHE_WRITE_APPLICATION_KEY", "fixture-key")
		vi.stubEnv("B2_BUCKET_ID", "fixture-bucket")
		const nativeResponse = Response
		const uploadedNames: string[] = []
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
				const url = String(input)
				if (url.includes("b2_authorize_account"))
					return new nativeResponse(
						JSON.stringify({
							authorizationToken: "auth-token",
							apiUrl: "https://api.fixture",
							downloadUrl: "https://download.fixture",
						}),
						{ status: 200 },
					)
				if (url.includes("b2_get_upload_url"))
					return new nativeResponse(
						JSON.stringify({
							uploadUrl: "https://upload.fixture",
							authorizationToken: "upload-token",
						}),
						{ status: 200 },
					)
				if (url === "https://upload.fixture") {
					uploadedNames.push(
						new Headers(init?.headers).get("X-Bz-File-Name") ?? "",
					)
					return new nativeResponse("{}", { status: 200 })
				}
				throw new Error(`Unexpected URL: ${url}`)
			}),
		)

		const pointer = await publish(root)
		expect(uploadedNames).toEqual([
			pointer.archiveName,
			expect.stringMatching(/latest\.json$/),
		])
		expect(pointer.archiveName).toMatch(/\/archives\/[a-f0-9]{64}\.tar\.gz$/)
	})
})
