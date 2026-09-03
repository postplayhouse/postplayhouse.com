import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import yaml from "js-yaml"
import { format } from "prettier"
import estreePlugin from "prettier/plugins/estree"
import typescriptPlugin from "prettier/plugins/typescript"
import { season } from "../../src/data/seasons"
import {
	validateArtifactConfig,
	type ArtifactConfig,
	type ArtifactConfigProvider,
	type ArtifactSourceDirectory,
} from "./config"
import { historicalImageProfiles } from "./profiles"

const imageExtensions = [
	"avif",
	"gif",
	"heif",
	"jpeg",
	"jpg",
	"png",
	"tiff",
	"webp",
	"svg",
] as const

const roots = [
	{
		id: "people",
		directory: "src/images/people",
		profile: "people-400-800",
		collection: "historicalPeoplePictures",
	},
	{
		id: "seasons",
		directory: "src/images/seasons",
		profile: "season-500-1000-1500",
		collection: "historicalSeasonPictures",
	},
] as const

export async function archivedYearDirectories(
	root: string,
	currentSeason = season,
): Promise<ArtifactSourceDirectory[]> {
	const sources: ArtifactSourceDirectory[] = []
	for (const configured of roots) {
		sources.push({
			id: `${configured.id}-root`,
			directory: configured.directory,
			logicalPrefix: "",
			profile: configured.profile,
			collection: configured.collection,
			extensions: imageExtensions,
			recursive: false,
		})
		for (const entry of await readdir(join(root, configured.directory), {
			withFileTypes: true,
		})) {
			if (!entry.isDirectory()) continue
			if (!/^\d{4}$/.test(entry.name))
				throw new Error(
					`Image directory ${configured.directory}/${entry.name} must use a four-digit year`,
				)
			const year = Number(entry.name)
			if (year > currentSeason)
				throw new Error(
					`Image directory ${configured.directory}/${entry.name} is newer than configured season ${currentSeason}; update src/data/seasons.ts before generating artifacts`,
				)
			if (year === currentSeason) continue
			sources.push({
				id: `${configured.id}-${year}`,
				directory: `${configured.directory}/${year}`,
				logicalPrefix: `${year}/`,
				profile: configured.profile,
				collection: configured.collection,
				extensions: imageExtensions,
				recursive: true,
			})
		}
	}
	return sources.sort((left, right) => left.id.localeCompare(right.id))
}

export const generatedLiveImagesPath =
	"src/generated/historical-images/live.ts" as const
export const generatedNewsImageReferencesPath =
	"src/lib/server/generated/news-image-references.ts" as const

type NewsImageReferences = Record<
	string,
	{ people: string[]; seasons: string[] }
>

function attribute(tag: string, name: string): string | undefined {
	return tag.match(new RegExp(`${name}=["']([^"']+)["']`))?.[1]
}

function location(content: string, index: number): string {
	const before = content.slice(0, index)
	const line = before.split("\n").length
	const column = index - before.lastIndexOf("\n")
	return `${line}:${column}`
}

export function imageComponentTags(
	content: string,
	file: string,
): Array<{ name: "PersonImage" | "SeasonImage"; tag: string; at: string }> {
	const tags: Array<{
		name: "PersonImage" | "SeasonImage"
		tag: string
		at: string
	}> = []
	const starts = /<(PersonImage|SeasonImage)\b/g
	for (const match of content.matchAll(starts)) {
		const end = content.indexOf(">", match.index)
		if (end < 0)
			throw new Error(
				`Unterminated ${match[1]} in ${file}:${location(content, match.index)}`,
			)
		const tag = content.slice(match.index, end + 1)
		if (tag.slice(1).includes("<"))
			throw new Error(
				`Cannot parse ${match[1]} in ${file}:${location(content, match.index)}`,
			)
		tags.push({
			name: match[1] as "PersonImage" | "SeasonImage",
			tag,
			at: `${file}:${location(content, match.index)}`,
		})
	}
	return tags
}

async function productionImage(
	root: string,
	content: string,
): Promise<string | undefined> {
	const match = content.match(/yaml\.productions\[["'](\d{4})["']\]\[(\d+)\]/)
	if (!match) return
	const productions = yaml.load(
		await readFile(join(root, `src/data/productions/${match[1]}.yml`), "utf8"),
	) as Array<{ image?: string }>
	return productions[Number(match[2])]?.image
}

export async function generatedNewsImageReferences(
	root = process.cwd(),
): Promise<string> {
	const newsRoot = join(root, "src/routes/(app)/news")
	const references: NewsImageReferences = {}
	for (const relative of await readdir(newsRoot, { recursive: true })) {
		if (!/\+page\.(?:md|svelte)$/.test(relative)) continue
		const content = await readFile(join(newsRoot, relative), "utf8")
		const people: string[] = []
		const seasons: string[] = []
		for (const component of imageComponentTags(content, `news/${relative}`)) {
			if (component.name !== "PersonImage") continue
			const key = attribute(component.tag, "partialPath")
			if (!key) throw new Error(`Cannot resolve PersonImage at ${component.at}`)
			people.push(key)
		}
		for (const component of imageComponentTags(content, `news/${relative}`)) {
			if (component.name !== "SeasonImage") continue
			const imageSeason = attribute(component.tag, "season")
			let imageFile = attribute(component.tag, "imageFile")
			if (imageFile?.includes("{image}")) {
				const prefix = imageFile.replace("{image}", "")
				const values = content.match(/const images = \[([\s\S]*?)\]/)?.[1]
				if (!values)
					throw new Error(`Cannot resolve image list in news/${relative}`)
				for (const value of values.matchAll(/["']([^"']+)["']/g))
					seasons.push(`${imageSeason}/${prefix}${value[1]}`)
				continue
			}
			if (!imageFile && component.tag.includes("imageFile={production.image}"))
				imageFile = await productionImage(root, content)
			if (!imageSeason || !imageFile)
				throw new Error(`Cannot resolve SeasonImage at ${component.at}`)
			seasons.push(`${imageSeason}/${imageFile}`)
		}
		if (people.length || seasons.length) {
			const slug = dirname(relative).replaceAll("\\", "/")
			references[`/(app)/news/${slug}`] = {
				people: [...new Set(people)].sort(),
				seasons: [...new Set(seasons)].sort(),
			}
		}
	}
	return format(
		`// Generated from news pages by pnpm images:historical:generate. Do not edit.\nexport const newsImageReferences = ${JSON.stringify(references)} as const\n`,
		{
			parser: "typescript",
			plugins: [estreePlugin, typescriptPlugin],
			semi: false,
			trailingComma: "all",
			useTabs: true,
		},
	)
}

export function generatedLiveImages(currentSeason = season): string {
	const extensions = imageExtensions.join(",")
	const query = (profile: keyof typeof historicalImageProfiles): string =>
		Object.entries(historicalImageProfiles[profile].query)
			.map(([name, value]) => `\t\t\t${name}: ${JSON.stringify(value)},`)
			.join("\n")
	return `// Generated from src/data/seasons.ts by pnpm images:historical:generate. Do not edit.
import type { Picture } from "$helpers/enhancedImg"
import { season } from "$data/seasons"

export const generatedCurrentSeason: number = ${currentSeason}
if (generatedCurrentSeason !== season)
	throw new Error(
		"Current image imports are stale; run pnpm images:historical:generate",
	)

const peopleModules = import.meta.glob(
	"/src/images/people/${currentSeason}/*.{${extensions}}",
	{
		eager: true,
		query: {
${query("people-400-800")}
		},
	},
)
export const currentPeoplePictures = Object.fromEntries(
	Object.entries(peopleModules).map(([path, module]) => [
		path.replace("/src/images/people/", ""),
		(module as { default: Picture }).default,
	]),
) as Record<string, Picture>

export const currentSeasonModules = import.meta.glob(
	"/src/images/seasons/${currentSeason}/*.{${extensions}}",
	{
		eager: true,
		query: {
${query("season-500-1000-1500")}
		},
	},
) as Record<string, { default: Picture }>
export const currentSeasonPictures = Object.fromEntries(
	Object.entries(currentSeasonModules).map(([path, module]) => [
		path.replace("/src/images/seasons/", ""),
		module.default,
	]),
) as Record<string, Picture>
`
}

export async function postPlayhouseArtifactConfig(
	root = process.cwd(),
	options: { allowGeneratedOutputsToBeStale?: boolean } = {},
): Promise<ArtifactConfig> {
	if (!options.allowGeneratedOutputsToBeStale) {
		const verifyGeneratedOutput = async (
			relativePath: string,
			expected: string,
		) => {
			let actual: string
			try {
				actual = await readFile(join(root, relativePath), "utf8")
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
				actual = ""
			}
			if (actual !== expected)
				throw new Error(
					`Generated image module is stale: ${relativePath}; run pnpm images:historical:generate`,
				)
		}
		await verifyGeneratedOutput(generatedLiveImagesPath, generatedLiveImages())
		await verifyGeneratedOutput(
			generatedNewsImageReferencesPath,
			await generatedNewsImageReferences(root),
		)
	}
	return validateArtifactConfig({
		identity: `postplayhouse-season-${season}`,
		legacyCurrentSeason: season,
		schemaVersion: 1,
		generatorRevision: 1,
		storePrefix: "historical-images/v1",
		lockPath: "historical-images/publication.v1.json",
		generatedMetadataPath: "src/lib/server/generated/historical-images.ts",
		generatedOutputPaths: [
			"src/lib/server/generated/historical-images.ts",
			generatedNewsImageReferencesPath,
			generatedLiveImagesPath,
		],
		pipelineSourcePaths: [
			"scripts/historical-images/generate.ts",
			"scripts/historical-images/compatibility.ts",
		],
		staticAssetRoot: "static/_app/immutable/assets",
		cacheRoot: ".cache/historical-images",
		publicAssetPrefix: "/_app/immutable/assets/",
		trustedPublishCommand: "pnpm images:historical:stage",
		profiles: historicalImageProfiles,
		sources: await archivedYearDirectories(root),
		profileExceptions: [
			{
				sourceId: "people-2018",
				logicalPath: "2018/ken-phillips.jpg",
				profile: "raffle-default-1x-2x",
				collection: "historicalRafflePictures",
			},
			{
				sourceId: "people-2016",
				logicalPath: "2016/dewayne-barrett.jpg",
				profile: "raffle-default-1x-2x",
				collection: "historicalRafflePictures",
			},
		],
	})
}

const provider: ArtifactConfigProvider = {
	load: postPlayhouseArtifactConfig,
	async afterGenerate(root) {
		for (const [relativePath, contents] of [
			[generatedLiveImagesPath, generatedLiveImages()],
			[
				generatedNewsImageReferencesPath,
				await generatedNewsImageReferences(root),
			],
		] as const) {
			const path = join(root, relativePath)
			await mkdir(dirname(path), { recursive: true })
			await writeFile(path, contents)
		}
	},
}

export default provider
