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
import { CURRENT_SEASON, GENERATED_MAP_PATH, profiles } from "./config"
import { deriveCompatibility } from "./compatibility"
import { discoverHistoricalSources, type DiscoveredSource } from "./discover"
import { derivePublicationId } from "./archive"
import { hashFile, sha256, stableJson } from "./hash"
import {
	manifestSchema,
	type HistoricalAsset,
	type HistoricalManifest,
	type HistoricalSource,
} from "./schema"

interface GenerationOptions {
	root: string
	output: string
	previousManifest?: string
	allowDeleted?: boolean
	createdAt?: string
}

function query(profile: string): string {
	if (profile === profiles.people.id)
		return "enhanced&w=400;800&withoutEnlargement=true"
	if (profile === profiles.season.id)
		return "enhanced&w=500;1000;1500&withoutEnlargement=true"
	if (profile === profiles.raffle.id) return "enhanced"
	throw new Error(`Unknown historical image profile: ${profile}`)
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
		return !prior || prior.transformKey !== transformKey(source, compatibility)
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
	profile: string,
): HistoricalSource["picture"] {
	const order = ["avif", "webp", "jpeg", "jpg", "png"]
	const descriptor = (srcset: string): string => {
		const normalized = srcset.replaceAll(".jpeg", ".jpg")
		if (profile !== profiles.raffle.id) return normalized
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

async function generateChanged(
	root: string,
	stage: string,
	changed: DiscoveredSource[],
): Promise<Record<string, HistoricalSource["picture"]>> {
	if (changed.length === 0) return {}
	const entry = join(stage, "entry.ts")
	const imports = changed.map(
		(source, index) =>
			`import image${index} from ${JSON.stringify(`/${source.path}?${query(source.profile)}`)}`,
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
					assetFileNames: "_app/immutable/assets/[name].[hash][extname]",
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

function generatedMap(manifest: HistoricalManifest): string {
	const maps: Record<string, Record<string, HistoricalSource["picture"]>> = {
		people: {},
		season: {},
		raffle: {},
	}
	for (const source of manifest.sources) {
		const key = source.path.replace(/^src\/images\/(?:people|seasons)\//, "")
		if (source.profile === profiles.people.id) maps.people[key] = source.picture
		else if (source.profile === profiles.season.id)
			maps.season[key] = source.picture
		else maps.raffle[key] = source.picture
	}
	return `// Generated by pnpm images:historical:generate. Do not edit.\nimport type { Picture } from "$helpers/enhancedImg"\n\n// prettier-ignore\nexport const historicalPeoplePictures = ${JSON.stringify(maps.people)} as const satisfies Record<string, Picture>\n// prettier-ignore\nexport const historicalSeasonPictures = ${JSON.stringify(maps.season)} as const satisfies Record<string, Picture>\n// prettier-ignore\nexport const historicalRafflePictures = ${JSON.stringify(maps.raffle)} as const satisfies Record<string, Picture>\n`
}

export async function generate(
	options: GenerationOptions,
): Promise<HistoricalManifest> {
	const { root, output } = options
	const previous = await loadPrevious(options.previousManifest)
	const discovered = await discoverHistoricalSources(root)
	const compatibility = await deriveCompatibility(root)
	const { changed, deleted } = planGeneration(
		discovered,
		previous,
		compatibility,
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
		const generated = await generateChanged(root, stage, changed)
		const sources: HistoricalSource[] = discovered.map((source) => {
			const key = sourceKey(source)
			const prior = previousByKey.get(key)
			const picture = generated[key]
				? canonicalizePicture(generated[key], source.profile)
				: prior && canonicalizePicture(prior.picture, source.profile)
			if (!picture) throw new Error(`Generator produced no Picture for ${key}`)
			return {
				...source,
				transformKey: transformKey(source, compatibility),
				picture,
			}
		})
		const bundleAssets = join(stage, "bundle", "_app", "immutable", "assets")
		const assetOutput = join(output, "assets")
		await mkdir(assetOutput, { recursive: true })
		const assetsByPath = new Map(
			previous?.assets.map((asset) => [asset.publicPath, asset]),
		)
		for (const source of sources.filter(
			(source) => generated[sourceKey(source)],
		)) {
			for (const publicPath of urls(source.picture)) {
				const relativePath = publicPath.replace(
					/^\/_app\/immutable\/assets\//,
					"",
				)
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
			currentSeason: CURRENT_SEASON,
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
		await mkdir(dirname(join(root, GENERATED_MAP_PATH)), { recursive: true })
		await writeFile(join(root, GENERATED_MAP_PATH), generatedMap(manifest))
		return manifest
	} finally {
		await rm(stage, { recursive: true, force: true })
	}
}
