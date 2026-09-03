// @vitest-environment node
import { describe, expect, it } from "vitest"
import { planGeneration } from "./generate"
import { sha256, stableJson } from "./hash"
import type { DiscoveredSource } from "./discover"
import type { HistoricalManifest } from "./schema"
import { generatedMap } from "./metadata"

const compatibility: HistoricalManifest["compatibility"] = {
	generatorRevision: 1,
	lockfileSha256: "1".repeat(64),
	packages: { sharp: "fixture" },
	libvips: "fixture",
	nodeMajor: 24,
	platform: "linux",
	arch: "x64",
	profileConfigurationSha256: "2".repeat(64),
}

function key(sourceSha256: string, profile: string): string {
	return sha256(stableJson({ sourceSha256, profile, compatibility }))
}

function previous(): HistoricalManifest {
	const source = {
		path: "inputs/catalog/old.jpg",
		logicalPath: "catalog/old.jpg",
		sourceId: "catalog",
		collection: "catalogPictures",
		bytes: 3,
		sha256: "3".repeat(64),
		profile: "thumbnail",
	}
	return {
		schemaVersion: 1,
		publicationId: "4".repeat(64),
		configurationId: "fixture-v1",
		createdAt: "2026-08-31T00:00:00.000Z",
		compatibility,
		sources: [
			{
				...source,
				transformKey: key(source.sha256, source.profile),
				picture: {
					sources: { jpeg: "/_app/immutable/assets/old.jpg 1w" },
					img: { src: "/_app/immutable/assets/old.jpg", w: 1, h: 1 },
				},
			},
		],
		assets: [],
	}
}

describe("incremental generation plan", () => {
	it("emits deterministic one-entry-per-line metadata without changing values", () => {
		const manifest = previous()
		const output = generatedMap(manifest)
		expect(output).toContain(
			`\t"catalog/old.jpg": ${JSON.stringify(manifest.sources[0].picture)},`,
		)
		expect(
			output.split("\n").filter((line) => line.startsWith('\t"')).length,
		).toBe(manifest.sources.length)
		expect(generatedMap(manifest)).toBe(output)
	})

	it("does no work for an unchanged source", () => {
		const prior = previous()
		const source = prior.sources.map(asDiscovered)
		expect(planGeneration(source, prior, compatibility)).toEqual({
			changed: [],
			deleted: [],
		})
	})

	it("generates changed and new sources while reporting deletions", () => {
		const prior = previous()
		const changed = {
			...asDiscovered(prior.sources[0]),
			bytes: 4,
			sha256: "5".repeat(64),
		}
		const added = {
			...asDiscovered(prior.sources[0]),
			path: "inputs/catalog/new.jpg",
			logicalPath: "catalog/new.jpg",
			bytes: 2,
			sha256: "6".repeat(64),
			profile: prior.sources[0].profile,
		}
		expect(planGeneration([changed, added], prior, compatibility)).toEqual({
			changed: [changed, added],
			deleted: [],
		})
		expect(planGeneration([added], prior, compatibility)).toEqual({
			changed: [added],
			deleted: prior.sources,
		})
	})

	it("regenerates sources when publisher compatibility changes", () => {
		const prior = previous()
		const source = prior.sources.map(asDiscovered)
		const changedCompatibility = { ...compatibility, generatorRevision: 2 }
		expect(planGeneration(source, prior, changedCompatibility).changed).toEqual(
			source,
		)
		expect(
			planGeneration(source, prior, changedCompatibility, true).changed,
		).toEqual([])
	})
})

function asDiscovered(
	source: HistoricalManifest["sources"][number],
): DiscoveredSource {
	return {
		path: source.path,
		logicalPath: source.logicalPath!,
		sourceId: source.sourceId!,
		collection: source.collection!,
		bytes: source.bytes,
		sha256: source.sha256,
		profile: source.profile,
	}
}
