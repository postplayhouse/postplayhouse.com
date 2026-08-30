import { describe, expect, test } from "vitest"
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { copyProgramBioImages } from "./copyProgramBioImagesVitePlugin"

describe("copyProgramBioImages", () => {
	test("copies every source image without buffering it into the bundle", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "program-bio-images-"))
		const source = path.join(root, "source")
		const output = path.join(root, "output")
		await mkdir(path.join(source, "2026"), { recursive: true })
		await writeFile(path.join(source, "2026", "person.jpg"), "image bytes")

		copyProgramBioImages(source, output)

		await expect(
			readFile(path.join(output, "2026", "person.jpg"), "utf8"),
		).resolves.toBe("image bytes")
	})
})
