import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { season } from "../../src/data/seasons"
import {
	validateArtifactConfig,
	type ArtifactConfig,
	type ArtifactConfigProvider,
	type ArtifactSourceDirectory,
} from "./config"

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

export function generatedLiveImages(currentSeason = season): string {
	const extensions = imageExtensions.join(",")
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
			enhanced: true,
			w: "400;800",
			withoutEnlargement: true,
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
			enhanced: true,
			w: "500;1000;1500",
			withoutEnlargement: true,
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
		const live = await readFile(join(root, generatedLiveImagesPath), "utf8")
		if (!live.includes(`generatedCurrentSeason: number = ${season}`))
			throw new Error(
				`Current image imports do not match configured season ${season}; run pnpm images:historical:generate`,
			)
	}
	return validateArtifactConfig({
		identity: `postplayhouse-season-${season}`,
		legacyCurrentSeason: season,
		schemaVersion: 1,
		generatorRevision: 1,
		// The declarative profiles below are behaviorally identical to the
		// qualified prototype profiles, so retain their transform identity.
		profileConfigurationSha256:
			"ae6440b9cc00fd7f39c2ac1c3dc3c169563f94ec5d00d82c36caf99ce550044e",
		storePrefix: "historical-images/v1",
		lockPath: "historical-images/publication.v1.json",
		generatedMetadataPath: "src/generated/historical-images/pictures.ts",
		staticAssetRoot: "static/_app/immutable/assets",
		cacheRoot: ".cache/historical-images",
		publicAssetPrefix: "/_app/immutable/assets/",
		trustedPublishCommand: "pnpm images:historical:publish",
		profiles: {
			"people-400-800": {
				query: { enhanced: true, w: "400;800", withoutEnlargement: true },
				srcsetDescriptors: "width",
			},
			"season-500-1000-1500": {
				query: {
					enhanced: true,
					w: "500;1000;1500",
					withoutEnlargement: true,
				},
				srcsetDescriptors: "width",
			},
			"raffle-default-1x-2x": {
				query: { enhanced: true },
				srcsetDescriptors: "density",
			},
		},
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
		const path = join(root, generatedLiveImagesPath)
		await mkdir(dirname(path), { recursive: true })
		await writeFile(path, generatedLiveImages())
	},
}

export default provider
