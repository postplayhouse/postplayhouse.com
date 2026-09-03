import {
	access,
	mkdir,
	readFile,
	rm,
	stat,
	writeFile,
	copyFile,
} from "node:fs/promises"
import { dirname, extname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "vite"
import { enhancedImages } from "@sveltejs/enhanced-img"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import sharp from "sharp"
import type { ArtifactConfig, ArtifactProfile } from "./config"
import { deriveCompatibility, derivePipelineSha256 } from "./compatibility"
import { discoverArtifactSources, type DiscoveredSource } from "./discover"
import {
	derivePublicationId,
	sourceSetSha256 as deriveSourceSetSha256,
} from "./archive"
import { hashFile, sha256, stableJson } from "./hash"
import {
	manifestSchema,
	lockSchema,
	type HistoricalAsset,
	type HistoricalManifest,
	type HistoricalSource,
} from "./schema"
import { generatedMap } from "./metadata"

interface GenerationOptions {
	root: string
	config: ArtifactConfig
	output: string
	previousManifest?: string
	allowDeleted?: boolean
	createdAt?: string
}

function query(profile: ArtifactProfile): string {
	return Object.entries(profile.query)
		.map(([name, value]) =>
			value === true ? name : `${name}=${encodeURIComponent(String(value))}`,
		)
		.join("&")
}

function sourceKey(source: Pick<DiscoveredSource, "path" | "profile">): string {
	return `${source.path}\0${source.profile}`
}

function transformKey(
	source: DiscoveredSource,
	compatibility: HistoricalManifest["compatibility"],
): string {
	return sha256(
		stableJson({
			sourceSha256: source.sha256,
			profile: source.profile,
			compatibility,
		}),
	)
}

export function planGeneration(
	discovered: DiscoveredSource[],
	previous: HistoricalManifest | null,
	compatibility: HistoricalManifest["compatibility"],
	previousTransformsQualified = false,
): { changed: DiscoveredSource[]; deleted: HistoricalSource[] } {
	const currentKeys = new Set(discovered.map(sourceKey))
	const deleted =
		previous?.sources.filter((source) => !currentKeys.has(sourceKey(source))) ??
		[]
	const previousByKey = new Map(
		previous?.sources.map((source) => [sourceKey(source), source]),
	)
	const changed = discovered.filter((source) => {
		const prior = previousByKey.get(sourceKey(source))
		return (
			!prior ||
			(!previousTransformsQualified &&
				prior.transformKey !== transformKey(source, compatibility))
		)
	})
	return { changed, deleted }
}

function urls(picture: HistoricalSource["picture"]): string[] {
	return [picture.img.src, ...Object.values(picture.sources)]
		.flatMap((srcset) => srcset.split(","))
		.map((candidate) => candidate.trim().split(/\s+/)[0])
}

function canonicalizePicture(
	picture: HistoricalSource["picture"],
	profile: ArtifactProfile,
): HistoricalSource["picture"] {
	const order = ["avif", "webp", "jpeg", "jpg", "png"]
	const descriptor = (srcset: string): string => {
		const normalized = srcset.replaceAll(".jpeg", ".jpg")
		if (profile.srcsetDescriptors !== "density") return normalized
		return normalized
			.split(",")
			.map((candidate, index) =>
				candidate.trim().replace(/\s+\d+w$/, ` ${index + 1}x`),
			)
			.join(", ")
	}
	return {
		sources: Object.fromEntries(
			Object.entries(picture.sources)
				.sort(([left], [right]) => order.indexOf(left) - order.indexOf(right))
				.map(([format, srcset]) => [format, descriptor(srcset)]),
		),
		img: { ...picture.img, src: picture.img.src.replaceAll(".jpeg", ".jpg") },
	}
}

async function loadPrevious(path?: string): Promise<HistoricalManifest | null> {
	if (!path) return null
	return manifestSchema.parse(JSON.parse(await readFile(path, "utf8")))
}

async function previousTransformsAreQualified(
	root: string,
	config: ArtifactConfig,
	path: string | undefined,
	previous: HistoricalManifest | null,
): Promise<boolean> {
	if (!path || !previous) return false
	const lock = lockSchema.parse(
		JSON.parse(await readFile(join(root, config.lockPath), "utf8")),
	)
	return (
		lock.schemaVersion === 2 &&
		(await hashFile(path)) === lock.manifestSha256 &&
		deriveSourceSetSha256(previous) === lock.sourceSetSha256 &&
		(await derivePipelineSha256(root, config)) === lock.pipelineSha256
	)
}

async function generateChanged(
	root: string,
	stage: string,
	changed: DiscoveredSource[],
	config: ArtifactConfig,
): Promise<Record<string, HistoricalSource["picture"]>> {
	if (changed.length === 0) return {}
	const entry = join(stage, "entry.ts")
	const imports = changed.map(
		(source, index) =>
			`import image${index} from ${JSON.stringify(`/${source.path}?${query(config.profiles[source.profile])}`)}`,
	)
	const exported = changed.map(
		(source, index) => `${JSON.stringify(sourceKey(source))}: image${index},`,
	)
	await writeFile(
		entry,
		`${imports.join("\n")}\nexport default {${exported.join("\n")}}\n`,
	)
	const bundle = join(stage, "bundle")
	await build({
		configFile: false,
		root,
		base: "/",
		plugins: [enhancedImages(), svelte()],
		logLevel: "warn",
		build: {
			outDir: bundle,
			emptyOutDir: true,
			minify: false,
			lib: { entry, formats: ["es"], fileName: () => "catalog.js" },
			rollupOptions: {
				output: {
					assetFileNames: `${config.publicAssetPrefix.slice(1)}[name].[hash][extname]`,
				},
			},
		},
	})
	const imported = (await import(
		`${pathToFileURL(join(bundle, "catalog.js")).href}?${Date.now()}`
	)) as {
		default: Record<string, HistoricalSource["picture"]>
	}
	return imported.default
}

async function describeAsset(
	path: string,
	publicPath: string,
): Promise<HistoricalAsset> {
	const details = await stat(path)
	const metadata = await sharp(path).metadata()
	const extension = extname(path)
		.slice(1)
		.toLowerCase() as HistoricalAsset["format"]
	if (!metadata.width || !metadata.height)
		throw new Error(`Cannot read generated image dimensions: ${path}`)
	return {
		publicPath,
		bytes: details.size,
		sha256: await hashFile(path),
		format: extension,
		width: metadata.width,
		height: metadata.height,
	}
}

async function generatedAssetPath(
	bundleAssets: string,
	relativePath: string,
): Promise<string> {
	const canonical = join(bundleAssets, decodeURIComponent(relativePath))
	try {
		await access(canonical)
		return canonical
	} catch (error) {
		if (!canonical.endsWith(".jpg")) throw error
		const warmCacheName = canonical.replace(/\.jpg$/, ".jpeg")
		await access(warmCacheName)
		return warmCacheName
	}
}

export async function generate(
	options: GenerationOptions,
): Promise<HistoricalManifest> {
	const { root, output, config } = options
	const previous = await loadPrevious(options.previousManifest)
	const discovered = await discoverArtifactSources(root, config)
	const compatibility = await deriveCompatibility(root, config)
	const previousTransformsQualified = await previousTransformsAreQualified(
		root,
		config,
		options.previousManifest,
		previous,
	)
	const { changed, deleted } = planGeneration(
		discovered,
		previous,
		compatibility,
		previousTransformsQualified,
	)
	if (deleted.length > 0 && !options.allowDeleted)
		throw new Error(
			`Historical source deletion requires --allow-deleted: ${deleted.map(sourceKey).join(", ")}`,
		)
	const previousByKey = new Map(
		previous?.sources.map((source) => [sourceKey(source), source]),
	)
	const stage = join(root, ".historical-images-generate.ignore")
	await rm(stage, { recursive: true, force: true })
	await mkdir(stage, { recursive: true })
	try {
		const generated = await generateChanged(root, stage, changed, config)
		const sources: HistoricalSource[] = discovered.map((source) => {
			const key = sourceKey(source)
			const prior = previousByKey.get(key)
			const picture = generated[key]
				? canonicalizePicture(generated[key], config.profiles[source.profile])
				: prior &&
					canonicalizePicture(prior.picture, config.profiles[source.profile])
			if (!picture) throw new Error(`Generator produced no Picture for ${key}`)
			return {
				...source,
				transformKey: transformKey(source, compatibility),
				picture,
			}
		})
		const bundleAssets = join(
			stage,
			"bundle",
			config.publicAssetPrefix.replace(/^\/+/, ""),
		)
		const assetOutput = join(output, "assets")
		await mkdir(assetOutput, { recursive: true })
		const assetsByPath = new Map(
			previous?.assets.map((asset) => [asset.publicPath, asset]),
		)
		for (const source of sources.filter(
			(source) => generated[sourceKey(source)],
		)) {
			for (const publicPath of urls(source.picture)) {
				if (!publicPath.startsWith(config.publicAssetPrefix))
					throw new Error(
						`Generated asset path is outside configured public prefix: ${publicPath}`,
					)
				const relativePath = publicPath.slice(config.publicAssetPrefix.length)
				const from = await generatedAssetPath(bundleAssets, relativePath)
				const to = join(assetOutput, relativePath)
				await mkdir(dirname(to), { recursive: true })
				await copyFile(from, to)
				assetsByPath.set(publicPath, await describeAsset(to, publicPath))
				if (publicPath.endsWith(".jpg")) {
					const aliasPath = publicPath.replace(/\.jpg$/, ".jpeg")
					const aliasTarget = to.replace(/\.jpg$/, ".jpeg")
					await copyFile(to, aliasTarget)
					assetsByPath.set(aliasPath, {
						...(await describeAsset(aliasTarget, aliasPath)),
						aliasOf: publicPath,
					})
				}
			}
		}
		const referenced = new Set(
			sources.flatMap((source) => urls(source.picture)),
		)
		for (const path of [...referenced].filter((path) => path.endsWith(".jpg")))
			referenced.add(path.replace(/\.jpg$/, ".jpeg"))
		const assets = [...assetsByPath.values()]
			.filter((asset) => referenced.has(asset.publicPath))
			.sort((left, right) => left.publicPath.localeCompare(right.publicPath))
		const base = {
			schemaVersion: 1 as const,
			configurationId: config.identity,
			createdAt:
				changed.length === 0 && previous
					? previous.createdAt
					: (options.createdAt ?? new Date().toISOString()),
			compatibility,
			sources,
			assets,
		}
		const manifest: HistoricalManifest = {
			...base,
			publicationId: derivePublicationId(base),
		}
		await mkdir(output, { recursive: true })
		await writeFile(
			join(output, "manifest.v1.json"),
			`${JSON.stringify(manifest)}\n`,
		)
		await mkdir(dirname(join(root, config.generatedMetadataPath)), {
			recursive: true,
		})
		await writeFile(
			join(root, config.generatedMetadataPath),
			generatedMap(manifest),
		)
		return manifest
	} finally {
		await rm(stage, { recursive: true, force: true })
	}
}
