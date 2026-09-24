import { execFileSync } from "child_process"
import { mkdtempSync, readFileSync, rmSync, statSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import sharp from "sharp"
import { afterEach, describe, expect, test } from "vitest"
import { markSourceJpegOptimized, optimizeNewJpegs } from "./optimize-new-jpegs"

const temporaryDirectories: string[] = []

function git(repo: string, ...args: string[]): string {
	return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim()
}

async function writeTestJpeg(
	path: string,
	seed: number,
	quality = 100,
): Promise<void> {
	const width = 320
	const height = 240
	const pixels = Buffer.alloc(width * height * 3)
	for (let index = 0; index < pixels.length; index++) {
		pixels[index] = (index * 31 + Math.floor(index / 3) * 17 + seed) % 256
	}
	await sharp(pixels, { raw: { width, height, channels: 3 } })
		.jpeg({ quality, chromaSubsampling: "4:4:4", mozjpeg: true })
		.toFile(path)
}

afterEach(() => {
	for (const directory of temporaryDirectories.splice(0)) {
		rmSync(directory, { recursive: true, force: true })
	}
})

describe("optimizeNewJpegs", () => {
	test("optimizes and re-stages only added JPEGs, then leaves its output unchanged", async () => {
		const repo = mkdtempSync(join(tmpdir(), "optimize-new-jpegs-"))
		temporaryDirectories.push(repo)
		git(repo, "init", "--quiet")
		git(repo, "config", "user.name", "Test")
		git(repo, "config", "user.email", "test@example.com")
		git(repo, "config", "commit.gpgSign", "false")

		const existing = join(repo, "existing.jpg")
		const added = join(repo, "added.JPEG")
		await writeTestJpeg(existing, 1)
		git(repo, "add", "existing.jpg")
		git(repo, "commit", "--quiet", "-m", "existing image")

		await writeTestJpeg(existing, 2)
		await writeTestJpeg(added, 3)
		git(repo, "add", "existing.jpg", "added.JPEG")

		const existingBytes = readFileSync(existing)
		const existingIndex = git(repo, "rev-parse", ":existing.jpg")
		const addedIndexBefore = git(repo, "rev-parse", ":added.JPEG")
		const addedSizeBefore = statSync(added).size

		await expect(optimizeNewJpegs(repo)).resolves.toEqual(["added.JPEG"])
		expect(readFileSync(existing)).toEqual(existingBytes)
		expect(git(repo, "rev-parse", ":existing.jpg")).toBe(existingIndex)
		expect(git(repo, "rev-parse", ":added.JPEG")).not.toBe(addedIndexBefore)
		expect(git(repo, "rev-parse", ":added.JPEG")).toBe(
			git(repo, "hash-object", "added.JPEG"),
		)
		expect(statSync(added).size).toBeLessThan(addedSizeBefore)

		const optimizedBytes = readFileSync(added)
		const optimizedIndex = git(repo, "rev-parse", ":added.JPEG")
		await expect(optimizeNewJpegs(repo)).resolves.toEqual(["added.JPEG"])
		expect(readFileSync(added)).toEqual(optimizedBytes)
		expect(git(repo, "rev-parse", ":added.JPEG")).toBe(optimizedIndex)
		expect((await sharp(added).metadata()).width).toBe(320)
	})

	test("allows the raw bio-submission commit to skip JPEG optimization", async () => {
		const repo = mkdtempSync(join(tmpdir(), "optimize-new-jpegs-bio-"))
		temporaryDirectories.push(repo)
		git(repo, "init", "--quiet")

		const added = join(repo, "submitted.jpg")
		await writeTestJpeg(added, 4)
		git(repo, "add", "submitted.jpg")
		const originalBytes = readFileSync(added)
		const originalIndex = git(repo, "rev-parse", ":submitted.jpg")

		process.env.SKIP_NEW_JPEG_OPTIMIZATION = "1"
		try {
			await expect(optimizeNewJpegs(repo)).resolves.toEqual([])
		} finally {
			delete process.env.SKIP_NEW_JPEG_OPTIMIZATION
		}

		expect(readFileSync(added)).toEqual(originalBytes)
		expect(git(repo, "rev-parse", ":submitted.jpg")).toBe(originalIndex)
	})

	test("does not recompress a new JPEG already optimized by the bio workflow", async () => {
		const repo = mkdtempSync(join(tmpdir(), "optimize-new-jpegs-bio-output-"))
		temporaryDirectories.push(repo)
		git(repo, "init", "--quiet")

		const added = join(repo, "converted.jpg")
		await writeTestJpeg(added, 5)
		markSourceJpegOptimized(added)
		git(repo, "add", "converted.jpg")
		const optimizedBytes = readFileSync(added)
		const optimizedIndex = git(repo, "rev-parse", ":converted.jpg")

		await expect(optimizeNewJpegs(repo)).resolves.toEqual(["converted.jpg"])
		expect(readFileSync(added)).toEqual(optimizedBytes)
		expect(git(repo, "rev-parse", ":converted.jpg")).toBe(optimizedIndex)
	})

	test("keeps a lower-quality original when MozJPEG savings are below 10%", async () => {
		const repo = mkdtempSync(join(tmpdir(), "optimize-new-jpegs-low-quality-"))
		temporaryDirectories.push(repo)
		git(repo, "init", "--quiet")

		const added = join(repo, "low-quality.jpg")
		await writeTestJpeg(added, 6, 20)
		const originalBytes = readFileSync(added)
		git(repo, "add", "low-quality.jpg")

		await expect(optimizeNewJpegs(repo)).resolves.toEqual(["low-quality.jpg"])
		const markedBytes = readFileSync(added)
		const markerLength = markedBytes.length - originalBytes.length
		expect(markerLength).toBeGreaterThan(0)
		expect(
			Buffer.concat([
				markedBytes.subarray(0, 2),
				markedBytes.subarray(2 + markerLength),
			]),
		).toEqual(originalBytes)
	})
})
