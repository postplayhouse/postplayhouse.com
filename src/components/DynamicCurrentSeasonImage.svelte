<!--
@component This component will load ALL season images for the current season
onto the page so they are actually created at build time. This is done by
rendering all the images into a hidden div. From there, it will dynamically find
the specific image you want based on the `imageFile` prop passed to it, and
render that image on the page without wrapping it in the hidden div.

Because of how build time import.meta works, we have to hard code the season
year into the string passed to the importMeta glob. This means that this
component will need to be updated each year to reflect the current season's
year. As long as svelte's prerender config will throw on HTTP errors, this will
ensure that builds do not succeed if the importMeta glob is not set up correctly
for the current season. Ideally, we would just use `svelte check` for this, but
there are some 200+ errors at the time of writing this. So a runtime check is
better for now.
-->
<script module lang="ts">
	import site from "$data/site"
	import { objectKeys } from "$helpers"
	const importMeta: Parameters<typeof makeFindImages>[0] = import.meta.glob(
		// This year portion of this string needs to be updated each year.
		`/src/images/seasons/2025/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}` satisfies `/src/images/seasons/${(typeof site)["season"]}/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
		{
			eager: true,
			query: {
				enhanced: true,
				w: "500;1000;1500",
				withoutEnlargement: true,
			},
		},
	)

	// Runtime check against the importMeta glob to ensure it matches the current season.
	if (
		!objectKeys(importMeta).every((key) =>
			key.startsWith(`/src/images/seasons/${site.season}/`),
		)
	) {
		throw new Error(
			`The importMeta glob for the current season images is not set up correctly. It should be updated to match the current season's year.`,
		)
	}
	const findCurrentSeasonImages = makeFindImages(importMeta)
</script>

<script lang="ts">
	import { makeFindImages, type Picture } from "$helpers/enhancedImg"
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
