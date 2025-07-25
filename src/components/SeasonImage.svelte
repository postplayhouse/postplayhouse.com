<script module lang="ts">
	import { makeFindImage, type Picture } from "$helpers/enhancedImg"
	const findEnhancedSeasonImage = makeFindImage(
		import.meta.glob(
			`/src/images/seasons/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
			{
				eager: true,
				query: {
					enhanced: true,
					w: "500;1000;1500",
					withoutEnlargement: true,
				},
			},
		),
	)
</script>

<script lang="ts">
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
	<enhanced:img src={enhancedImage} {...rest}></enhanced:img>
{/if}
