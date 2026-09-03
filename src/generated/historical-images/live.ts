// Generated from src/data/seasons.ts by pnpm images:historical:generate. Do not edit.
import type { Picture } from "$helpers/enhancedImg"
import { season } from "$data/seasons"

export const generatedCurrentSeason: number = 2027
if (generatedCurrentSeason !== season)
	throw new Error(
		"Current image imports are stale; run pnpm images:historical:generate",
	)

const peopleModules = import.meta.glob(
	"/src/images/people/2027/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}",
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
	"/src/images/seasons/2027/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}",
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
