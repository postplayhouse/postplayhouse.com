import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"
import type { ArtifactConfig } from "./config"
import { hashFile, sha256, stableJson } from "./hash"
import type { HistoricalManifest } from "./schema"

const packageNames = [
	"@sveltejs/enhanced-img",
	"vite",
	"vite-imagetools",
	"imagetools-core",
	"sharp",
] as const

async function packageVersion(root: string, name: string): Promise<string> {
	const direct = join(root, "node_modules", ...name.split("/"), "package.json")
	const candidates = [direct]
	for (const entry of await readdir(join(root, "node_modules/.pnpm"), {
		withFileTypes: true,
	})) {
		if (entry.isDirectory())
			candidates.push(
				join(
					root,
					"node_modules/.pnpm",
					entry.name,
					"node_modules",
					...name.split("/"),
					"package.json",
				),
			)
	}
	for (const path of candidates) {
		try {
			const pkg = JSON.parse(await readFile(path, "utf8")) as {
				name?: string
				version?: string
			}
			if (pkg.name === name && pkg.version) return pkg.version
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
		}
	}
	throw new Error(`Cannot determine installed ${name} version`)
}

export async function deriveCompatibility(
	root: string,
	config: ArtifactConfig,
): Promise<HistoricalManifest["compatibility"]> {
	const packages = Object.fromEntries(
		await Promise.all(
			packageNames.map(async (name) => [
				name,
				await packageVersion(root, name),
			]),
		),
	)
	const generatorSources = await Promise.all(
		config.pipelineSourcePaths.map(async (path) => ({
			path,
			sha256: await hashFile(join(root, path)),
		})),
	)
	return {
		generatorRevision: config.generatorRevision,
		// Kept under the v1 field name for schema compatibility. This is now a
		// narrow digest of byte-affecting package identities, not the whole lock.
		lockfileSha256: sha256(stableJson(packages)),
		packages,
		libvips: sharp.versions.vips,
		nodeMajor: Number(process.versions.node.split(".")[0]),
		nodeVersion: process.versions.node,
		platform: process.platform,
		arch: process.arch,
		profileConfigurationSha256: sha256(stableJson(config.profiles)),
		generatorSourceSha256: sha256(stableJson(generatorSources)),
		sharpVersionsSha256: sha256(stableJson(sharp.versions)),
	}
}

export async function derivePipelineSha256(
	root: string,
	config: ArtifactConfig,
): Promise<string> {
	const compatibility = await deriveCompatibility(root, config)
	return sha256(
		stableJson({
			generatorRevision: compatibility.generatorRevision,
			packages: compatibility.packages,
			profileConfigurationSha256: compatibility.profileConfigurationSha256,
			generatorSourceSha256: compatibility.generatorSourceSha256,
		}),
	)
}
