<script module lang="ts">
	import type { Picture } from "$helpers/enhancedImg"
	import { season } from "$data/seasons"
	import { historicalPeoplePictures } from "../generated/historical-images/pictures"

	const currentModules = import.meta.glob(
		`/src/images/people/2027/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}` satisfies `/src/images/people/${typeof season}/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
		{
			eager: true,
			query: {
				enhanced: true,
				w: "400;800",
				withoutEnlargement: true,
			},
		},
	)
	const currentPeoplePictures = Object.fromEntries(
		Object.entries(currentModules).map(([path, module]) => [
			path.replace("/src/images/people/", ""),
			(module as { default: Picture }).default,
		]),
	) as Record<string, Picture>

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
