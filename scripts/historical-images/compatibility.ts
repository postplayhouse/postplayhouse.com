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
	return {
		generatorRevision: config.generatorRevision,
		lockfileSha256: await hashFile(join(root, "pnpm-lock.yaml")),
		packages: Object.fromEntries(
			await Promise.all(
				packageNames.map(async (name) => [
					name,
					await packageVersion(root, name),
				]),
			),
		),
		libvips: sharp.versions.vips,
		nodeMajor: Number(process.versions.node.split(".")[0]),
		platform: process.platform,
		arch: process.arch,
		profileConfigurationSha256:
			config.profileConfigurationSha256 ?? sha256(stableJson(config.profiles)),
	}
}
