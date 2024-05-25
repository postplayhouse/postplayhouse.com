<script lang="ts">
	import { findEnhancedSeasonImage, type Picture } from "$helpers/enhancedImg"
	import type { HTMLImgAttributes } from "svelte/elements"

	type Props = Omit<HTMLImgAttributes, "src"> & {
		season: number | string | undefined
		imageFile: string | undefined
	}

	let { season, imageFile, ...rest }: Props = $props()

	const enhancedImage = $derived(
		findEnhancedSeasonImage(`${season}/${imageFile}`) as
			| (string & Picture)
			| undefined,
	)
</script>

{#if enhancedImage}
	<enhanced:img src="{enhancedImage}" {...rest}></enhanced:img>
{/if}
