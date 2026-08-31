<!-- @component Loads the generated current-season image catalog and displays one entry. -->
<script module lang="ts">
	import { makeFindImages } from "$helpers/enhancedImg"
	import { currentSeasonModules } from "../generated/historical-images/live"

	const findCurrentSeasonImages = makeFindImages(currentSeasonModules)
</script>

<script lang="ts">
	import type { Picture } from "$helpers/enhancedImg"
	import type { HTMLImgAttributes } from "svelte/elements"

	type Props = Omit<HTMLImgAttributes, "src"> & {
		imageFile: string | undefined
	}

	let { imageFile, ...rest }: Props = $props()

	let allImages = $derived(findCurrentSeasonImages() || [])

	const enhancedImage = $derived(
		allImages.find(({ path }) => imageFile && path.endsWith(imageFile))
			?.image as (string & Picture) | undefined,
	)
</script>

{#each allImages as { image }}
	<enhanced:img
		src={image}
		{...rest}
		class={image === enhancedImage ? rest.class : "hidden"}
	></enhanced:img>
{/each}
