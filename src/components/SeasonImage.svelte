<script module lang="ts">
	import type { Picture } from "$helpers/enhancedImg"
	import { season as currentSeason } from "$data/seasons"
	import { historicalSeasonPictures } from "../generated/historical-images/pictures"

	const currentModules = import.meta.glob(
		`/src/images/seasons/2027/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}` satisfies `/src/images/seasons/${typeof currentSeason}/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
		{
			eager: true,
			query: {
				enhanced: true,
				w: "500;1000;1500",
				withoutEnlargement: true,
			},
		},
	)
	const currentSeasonPictures = Object.fromEntries(
		Object.entries(currentModules).map(([path, module]) => [
			path.replace("/src/images/seasons/", ""),
			(module as { default: Picture }).default,
		]),
	) as Record<string, Picture>

	export function findSeasonImage(
		season: number | string | undefined,
		imageFile: string | undefined,
	): Picture | undefined {
		if (!season || !imageFile) return
		const key = `${season}/${imageFile}`
		return (
			currentSeasonPictures[key] ??
			(historicalSeasonPictures as Record<string, Picture>)[key]
		)
	}
</script>

<script lang="ts">
	import type { HTMLImgAttributes } from "svelte/elements"

	type Props = Omit<HTMLImgAttributes, "src"> & {
		season: number | string | undefined
		imageFile: string | undefined
	}

	let { season, imageFile, ...rest }: Props = $props()

	const enhancedImage = $derived(findSeasonImage(season, imageFile))
</script>

{#if enhancedImage}
	<enhanced:img src={enhancedImage} {...rest}></enhanced:img>
{/if}
