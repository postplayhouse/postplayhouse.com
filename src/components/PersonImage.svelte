<script module lang="ts">
	import type { Picture } from "$helpers/enhancedImg"
	import { historicalPeoplePictures } from "../generated/historical-images/pictures"
	import { currentPeoplePictures } from "../generated/historical-images/live"

	function findPersonImage(path: string | undefined): Picture | undefined {
		const key = path?.replace(/^\/?(?:src\/)?images\/people\//, "")
		if (!key) return
		return (
			currentPeoplePictures[key] ??
			(historicalPeoplePictures as Record<string, Picture>)[key]
		)
	}
</script>

<script lang="ts">
	import type { HTMLImgAttributes } from "svelte/elements"

	type Props = Omit<HTMLImgAttributes, "src"> & {
		partialPath: string | undefined
	}

	let { partialPath, ...rest }: Props = $props()

	const enhancedImage = $derived(findPersonImage(partialPath))
</script>

{#if enhancedImage}
	<enhanced:img src={enhancedImage} {...rest}></enhanced:img>
{:else if partialPath}
	<img src={partialPath} {...rest} />
{/if}
