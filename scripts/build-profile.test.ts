import { describe, expect, test } from "vitest"
import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

// @ts-expect-error The executable JavaScript utility has no declaration file.
import { createArtifactManifest } from "./build-artifact-manifest.mjs"
// @ts-expect-error The executable JavaScript utility has no declaration file.
import { summarizeSamples } from "./profile-build.mjs"

describe("summarizeSamples", () => {
	test("reports peak and time at fixed and peak-relative thresholds", () => {
		const summary = summarizeSamples(
			[
				{ elapsedMs: 0, rssBytes: 1_000 },
				{ elapsedMs: 250, rssBytes: 3_100 },
				{ elapsedMs: 500, rssBytes: 4_000 },
				{ elapsedMs: 750, rssBytes: 3_700 },
				{ elapsedMs: 1_000, rssBytes: 2_000 },
			],
			[3_000],
		)

		expect(summary).toEqual({
			peakRssBytes: 4_000,
			millisecondsAtOrAbove: { "3000": 750 },
			millisecondsAtOrAbove90PercentOfPeak: 500,
		})
	})
})

describe("createArtifactManifest", () => {
	test("returns sorted paths, sizes, and stable file digests", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "artifact-manifest-"))
		await mkdir(path.join(root, "nested"))
		await writeFile(path.join(root, "z.txt"), "z")
		await writeFile(path.join(root, "nested", "a.txt"), "abc")

		await expect(createArtifactManifest(root)).resolves.toEqual([
			{
				path: "nested/a.txt",
				size: 3,
				sha256:
					"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
			},
			{
				path: "z.txt",
				size: 1,
				sha256:
					"594e519ae499312b29433b7dd8a97ff068defcba9755b6d5d00e84c524d67b06",
			},
		])
	})
})
