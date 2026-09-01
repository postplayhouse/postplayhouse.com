<script module lang="ts">
	import type { Picture } from "$helpers/enhancedImg"
	import { currentPeoplePictures } from "../generated/historical-images/live"
	import { personImageKey } from "$lib/historical-images"
</script>

<script lang="ts">
	import { page } from "$app/state"
	import type { HTMLImgAttributes } from "svelte/elements"
	import type { HistoricalImagePageData } from "$lib/historical-images"

	type Props = Omit<HTMLImgAttributes, "src"> & {
		partialPath: string | undefined
		picture?: Picture
	}

	let { partialPath, picture, ...rest }: Props = $props()

	const key = $derived(personImageKey(partialPath))
	const pagePictures = $derived(
		(page.data.historicalImages as HistoricalImagePageData | undefined)?.people,
	)
	const enhancedImage = $derived(
		picture ??
			(key ? (currentPeoplePictures[key] ?? pagePictures?.[key]) : undefined),
	)
</script>

{#if enhancedImage}
	<enhanced:img src={enhancedImage} {...rest}></enhanced:img>
{:else if partialPath}
	<img src={partialPath} {...rest} />
{/if}
