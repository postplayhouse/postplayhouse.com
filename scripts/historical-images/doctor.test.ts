// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, expect, it, vi } from "vitest"
import { diagnose } from "./doctor"
import { artifactTestConfig } from "./test-config"

const temporary: string[] = []

afterEach(async () => {
	vi.unstubAllGlobals()
	delete process.env.HISTORICAL_IMAGES_READ_B2_APPLICATION_KEY
	delete process.env.HISTORICAL_IMAGES_READ_B2_APPLICATION_KEY_ID
	delete process.env.HISTORICAL_IMAGES_READ_B2_BUCKET_ID
	for (const path of temporary.splice(0))
		await rm(path, { recursive: true, force: true })
})

it("is offline and non-mutating and never reports credential values", async () => {
	const root = await mkdtemp(join(tmpdir(), "historical-doctor-"))
	temporary.push(root)
	const config = artifactTestConfig()
	await mkdir(dirname(join(root, config.lockPath)), { recursive: true })
	await writeFile(join(root, config.lockPath), "{}\n")
	await mkdir(join(root, config.cacheRoot), { recursive: true })
	await writeFile(join(root, config.cacheRoot, "entry"), "cache")
	const before = await readFile(join(root, config.cacheRoot, "entry"), "utf8")
	const secret = "DO-NOT-PRINT-THIS-SECRET"
	process.env.HISTORICAL_IMAGES_READ_B2_BUCKET_ID = "bucket"
	process.env.HISTORICAL_IMAGES_READ_B2_APPLICATION_KEY_ID = "key-id"
	process.env.HISTORICAL_IMAGES_READ_B2_APPLICATION_KEY = secret
	const fetch = vi.fn()
	vi.stubGlobal("fetch", fetch)

	const result = await diagnose(root, config)
	const serialized = JSON.stringify(result)
	expect(fetch).not.toHaveBeenCalled()
	expect(serialized).not.toContain(secret)
	expect(result).toMatchObject({
		lock: { status: "invalid" },
		cache: { files: 1, bytes: 5, verification: "unverified" },
		credentials: { read: { configured: true, presenceOnly: true } },
		network: "not-contacted",
	})
	expect(await readFile(join(root, config.cacheRoot, "entry"), "utf8")).toBe(
		before,
	)
})
