<script module lang="ts">
	import type { Picture } from "$helpers/enhancedImg"
	import { currentSeasonPictures } from "../generated/historical-images/live"
	import { seasonImageKey } from "$lib/historical-images"
</script>

<script lang="ts">
	import { page } from "$app/state"
	import type { HTMLImgAttributes } from "svelte/elements"
	import type { HistoricalImagePageData } from "$lib/historical-images"

	type Props = Omit<HTMLImgAttributes, "src"> & {
		season: number | string | undefined
		imageFile: string | undefined
		picture?: Picture
	}

	let { season, imageFile, picture, ...rest }: Props = $props()

	const key = $derived(seasonImageKey(season, imageFile))
	const pagePictures = $derived(
		(page.data.historicalImages as HistoricalImagePageData | undefined)
			?.seasons,
	)
	const enhancedImage = $derived(
		picture ??
			(key ? (currentSeasonPictures[key] ?? pagePictures?.[key]) : undefined),
	)
</script>

{#if enhancedImage}
	<enhanced:img src={enhancedImage} {...rest}></enhanced:img>
{/if}
