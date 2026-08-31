// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import sharp from "sharp"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
	CURRENT_SEASON,
	LOCK_PATH,
	STATIC_ASSET_ROOT,
	objectName,
} from "./config"
import { sha256, stableJson } from "./hash"
import type { HistoricalManifest } from "./schema"
import { FileArtifactStore, type ArtifactStore } from "./store"

const temporary: string[] = []
const compatibility: HistoricalManifest["compatibility"] = {
	generatorRevision: 1,
	lockfileSha256: "1".repeat(64),
	packages: { vite: "fixture" },
	libvips: "fixture",
	nodeMajor: 24,
	platform: "linux",
	arch: "x64",
	profileConfigurationSha256: "2".repeat(64),
}
let discovered: Array<{
	path: string
	bytes: number
	sha256: string
	profile: string
}> = []

vi.mock("./compatibility", () => ({
	deriveCompatibility: async () => compatibility,
}))
vi.mock("./discover", () => ({
	discoverHistoricalSources: async () => discovered,
}))

const { derivePublicationId, publish, restore } = await import("./archive")

async function temp(prefix: string): Promise<string> {
	const path = await mkdtemp(join(tmpdir(), prefix))
	temporary.push(path)
	return path
}

afterEach(async () => {
	for (const path of temporary.splice(0))
		await rm(path, { recursive: true, force: true })
})

async function fixture(): Promise<{
	root: string
	output: string
	storeRoot: string
	manifest: HistoricalManifest
	body: Buffer
}> {
	const root = await temp("historical-root-")
	const output = await temp("historical-output-")
	const storeRoot = await temp("historical-store-")
	const body = await sharp({
		create: { width: 4, height: 3, channels: 3, background: "#abcdef" },
	})
		.jpeg()
		.toBuffer()
	const source = {
		path: "src/images/people/2018/person.jpg",
		bytes: 7,
		sha256: "3".repeat(64),
		profile: "people-400-800",
	}
	discovered = [source]
	const publicPath = "/_app/immutable/assets/person%20fixture.jpg"
	const asset = {
		publicPath,
		bytes: body.length,
		sha256: sha256(body),
		format: "jpg" as const,
		width: 4,
		height: 3,
	}
	const base = {
		schemaVersion: 1 as const,
		currentSeason: CURRENT_SEASON,
		createdAt: "2026-08-31T00:00:00.000Z",
		compatibility,
		sources: [
			{
				...source,
				transformKey: "4".repeat(64),
				picture: {
					sources: { jpeg: `${publicPath} 4w` },
					img: { src: publicPath, w: 4, h: 3 },
				},
			},
		],
		assets: [asset],
	}
	const manifest: HistoricalManifest = {
		...base,
		publicationId: derivePublicationId(base),
	}
	const assetPath = join(output, "assets", "person%20fixture.jpg")
	await mkdir(dirname(assetPath), { recursive: true })
	await writeFile(assetPath, body)
	await writeFile(join(output, "manifest.v1.json"), `${stableJson(manifest)}\n`)
	return { root, output, storeRoot, manifest, body }
}

describe("historical artifact publication", () => {
	it("publishes immutable objects before its atomic pointer and reuses identical objects", async () => {
		const { root, output, storeRoot } = await fixture()
		const backing = new FileArtifactStore(storeRoot)
		const events: string[] = []
		const store: ArtifactStore = {
			get: (name) => backing.get(name),
			putImmutable: async (name, body) => {
				events.push(`immutable:${name}`)
				return backing.putImmutable(name, body)
			},
			putPointer: async (name, body) => {
				events.push(`pointer:${name}`)
				await backing.putPointer(name, body)
			},
		}
		const first = await publish(
			root,
			store,
			join(output, "manifest.v1.json"),
			join(output, "assets"),
		)
		expect(first.objectsCreated).toBe(1)
		expect(events.at(-1)).toMatch(/^pointer:/)
		const second = await publish(
			root,
			store,
			join(output, "manifest.v1.json"),
			join(output, "assets"),
		)
		expect(second.objectsCreated).toBe(0)
		expect(second.objectsReused).toBe(1)
		expect(await readFile(join(root, LOCK_PATH), "utf8")).toBe(
			`${stableJson(first.lock)}\n`,
		)
	})

	it("rejects an immutable name collision", async () => {
		const store = new FileArtifactStore(await temp("historical-collision-"))
		await store.putImmutable("immutable/object", Buffer.from("first"))
		await expect(
			store.putImmutable("immutable/object", Buffer.from("second")),
		).rejects.toThrow(/collision/)
	})

	it("does not publish a manifest pointer or lock after an object failure", async () => {
		const { root, output } = await fixture()
		const putPointer = vi.fn()
		const store: ArtifactStore = {
			get: async () => null,
			putImmutable: async () => {
				throw new Error("transport unavailable")
			},
			putPointer,
		}

		await expect(
			publish(
				root,
				store,
				join(output, "manifest.v1.json"),
				join(output, "assets"),
			),
		).rejects.toThrow(/transport unavailable/)
		expect(putPointer).not.toHaveBeenCalled()
		await expect(readFile(join(root, LOCK_PATH))).rejects.toMatchObject({
			code: "ENOENT",
		})
	})
})

describe("historical artifact restore", () => {
	it("restores a cold object, then succeeds offline from its verified warm cache", async () => {
		const { root, output, storeRoot, manifest, body } = await fixture()
		const store = new FileArtifactStore(storeRoot)
		await publish(
			root,
			store,
			join(output, "manifest.v1.json"),
			join(output, "assets"),
		)
		const cold = await restore(root, store)
		expect(cold).toEqual({
			restored: 1,
			cached: 0,
			bytesTransferred: body.length,
		})
		await rm(join(root, STATIC_ASSET_ROOT), { recursive: true, force: true })
		await rm(storeRoot, { recursive: true, force: true })
		const warm = await restore(root, null)
		expect(warm).toEqual({ restored: 1, cached: 1, bytesTransferred: 0 })
		expect(
			await readFile(join(root, STATIC_ASSET_ROOT, "person fixture.jpg")),
		).toEqual(body)
		discovered = [{ ...discovered[0], sha256: "9".repeat(64) }]
		await expect(restore(root, null)).rejects.toThrow(
			/source inventory is stale/,
		)
		discovered = manifest.sources.map(({ path, bytes, sha256, profile }) => ({
			path,
			bytes,
			sha256,
			profile,
		}))
	})

	it("fails closed when a cold store is unavailable or an object is tampered", async () => {
		const { root, output, storeRoot, manifest } = await fixture()
		const store = new FileArtifactStore(storeRoot)
		await publish(
			root,
			store,
			join(output, "manifest.v1.json"),
			join(output, "assets"),
		)
		await expect(restore(root, null)).rejects.toThrow(/manifest is not cached/)
		await restore(root, store)
		await rm(join(root, STATIC_ASSET_ROOT), { recursive: true, force: true })
		const asset = manifest.assets[0]
		await writeFile(
			join(root, ".cache/historical-images/objects", asset.sha256),
			"tampered",
		)
		await writeFile(join(storeRoot, objectName(asset.sha256)), "tampered")
		await expect(restore(root, store)).rejects.toThrow(
			/failed integrity verification/,
		)
	})
})
