<script module lang="ts">
	import type { Picture } from "$helpers/enhancedImg"
	import { historicalSeasonPictures } from "../generated/historical-images/pictures"
	import { currentSeasonPictures } from "../generated/historical-images/live"

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
