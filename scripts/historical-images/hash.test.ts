// @vitest-environment node
import { mkdtemp, rm, utimes, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { sha256, statHashCache } from "./hash"

let root = ""
let file = ""
let cachePath = ""
beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), "stat-hash-cache-"))
	file = join(root, "image.avif")
	cachePath = join(root, "cache", "hash-cache.json")
})
afterEach(async () => {
	vi.restoreAllMocks()
	await rm(root, { recursive: true, force: true })
})

it("rehashes a same-size file whose mtime was restored after editing", async () => {
	await writeFile(file, "original")
	// Whole seconds survive utimes exactly, so only ctime can reveal the edit.
	await utimes(file, 1_700_000_000, 1_700_000_000)
	// Let the write settle past the racy window so the first digest is cached.
	vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60_000)
	const first = await statHashCache(cachePath)
	expect(await first.hash(file)).toBe(sha256("original"))
	await first.save()

	await writeFile(file, "tampered")
	await utimes(file, 1_700_000_000, 1_700_000_000)

	const second = await statHashCache(cachePath)
	expect(await second.hash(file)).toBe(sha256("tampered"))
})

it("does not cache a file rewritten within the same timestamp tick", async () => {
	await writeFile(file, "AAAAAAAA")
	const first = await statHashCache(cachePath)
	expect(await first.hash(file)).toBe(sha256("AAAAAAAA"))
	await writeFile(file, "BBBBBBBB")
	await first.save()

	const second = await statHashCache(cachePath)
	expect(await second.hash(file)).toBe(sha256("BBBBBBBB"))
})
