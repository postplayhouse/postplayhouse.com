// @vitest-environment node
import { mkdir, mkdtemp, rm, unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { validateArtifactConfig } from "./config"
import { discoverArtifactSources } from "./discover"
import { artifactTestConfig } from "./test-config"

const temporary: string[] = []

afterEach(async () => {
	for (const path of temporary.splice(0))
		await rm(path, { recursive: true, force: true })
})

async function fixture(): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "artifact-discovery-"))
	temporary.push(root)
	await mkdir(join(root, "inputs/catalog-a/nested"), { recursive: true })
	await mkdir(join(root, "inputs/catalog-b"), { recursive: true })
	await writeFile(join(root, "inputs/catalog-a/cover.jpg"), "cover-v1")
	await writeFile(join(root, "inputs/catalog-a/nested/detail.png"), "detail")
	await writeFile(join(root, "inputs/catalog-a/ignored.JPG"), "uppercase")
	await writeFile(join(root, "inputs/catalog-b/banner.webp"), "banner")
	return root
}

function config() {
	return artifactTestConfig({
		sources: [
			{
				id: "catalog-a",
				directory: "inputs/catalog-a",
				logicalPrefix: "archive/a/",
				profile: "thumbnail",
				collection: "catalogPictures",
				extensions: ["jpg", "png"],
				recursive: true,
			},
			{
				id: "catalog-b",
				directory: "inputs/catalog-b",
				logicalPrefix: "archive/b/",
				profile: "thumbnail",
				collection: "catalogPictures",
				extensions: ["webp"],
			},
		],
		profileExceptions: [
			{
				sourceId: "catalog-a",
				logicalPath: "archive/a/cover.jpg",
				profile: "density",
				collection: "featuredPictures",
			},
		],
	})
}

describe("generic artifact discovery", () => {
	it("maps multiple directories, exact-case extensions, recursion, and profile exceptions", async () => {
		const root = await fixture()
		const sources = await discoverArtifactSources(root, config())

		expect(
			sources.map(({ logicalPath, profile, collection }) => ({
				logicalPath,
				profile,
				collection,
			})),
		).toEqual([
			{
				logicalPath: "archive/a/cover.jpg",
				profile: "density",
				collection: "featuredPictures",
			},
			{
				logicalPath: "archive/a/cover.jpg",
				profile: "thumbnail",
				collection: "catalogPictures",
			},
			{
				logicalPath: "archive/a/nested/detail.png",
				profile: "thumbnail",
				collection: "catalogPictures",
			},
			{
				logicalPath: "archive/b/banner.webp",
				profile: "thumbnail",
				collection: "catalogPictures",
			},
		])
		expect(sources.some(({ path }) => path.endsWith(".JPG"))).toBe(false)
	})

	it("reflects additions, content changes, and deletions deterministically", async () => {
		const root = await fixture()
		const first = await discoverArtifactSources(root, config())
		await writeFile(join(root, "inputs/catalog-a/cover.jpg"), "cover-v2")
		await writeFile(join(root, "inputs/catalog-b/new.webp"), "new")
		await unlink(join(root, "inputs/catalog-a/nested/detail.png"))
		const second = await discoverArtifactSources(root, config())

		expect(
			second.filter(({ logicalPath }) => logicalPath.endsWith("cover.jpg")),
		).not.toEqual(
			first.filter(({ logicalPath }) => logicalPath.endsWith("cover.jpg")),
		)
		expect(
			second.some(({ logicalPath }) => logicalPath.endsWith("new.webp")),
		).toBe(true)
		expect(
			second.some(({ logicalPath }) => logicalPath.endsWith("detail.png")),
		).toBe(false)
	})

	it("rejects invalid directory/profile mappings before discovery", () => {
		expect(() =>
			validateArtifactConfig(
				artifactTestConfig({
					sources: [
						{
							id: "input",
							directory: "inputs/a",
							logicalPrefix: "a/",
							profile: "unknown",
							collection: "pictures",
							extensions: ["jpg"],
						},
					],
				}),
			),
		).toThrow(/Unknown artifact profile/)
	})

	it("rejects missing inputs and colliding generated metadata paths", async () => {
		const root = await fixture()
		await expect(
			discoverArtifactSources(
				root,
				artifactTestConfig({
					sources: [
						{
							...config().sources[0],
							directory: "inputs/missing",
						},
					],
				}),
			),
		).rejects.toThrow(/source directory does not exist: inputs\/missing/)

		const duplicate = config()
		await expect(
			discoverArtifactSources(root, {
				...duplicate,
				sources: [
					duplicate.sources[0],
					{ ...duplicate.sources[0], id: "copy" },
				],
				profileExceptions: [],
			}),
		).rejects.toThrow(/Duplicate generated metadata path/)
	})
})
