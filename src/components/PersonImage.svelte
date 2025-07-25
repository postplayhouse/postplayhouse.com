<script module lang="ts">
	import { makeFindImage, type Picture } from "$helpers/enhancedImg"
	const findEnhancedPersonImage = makeFindImage(
		import.meta.glob(
			`/src/images/people/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
			{
				eager: true,
				query: {
					enhanced: true,
					w: "400;800",
					withoutEnlargement: true,
				},
			},
		),
	)
</script>

<script lang="ts">
	import type { HTMLImgAttributes } from "svelte/elements"

	type Props = Omit<HTMLImgAttributes, "src"> & {
		partialPath: string | undefined
	}

	let { partialPath, ...rest }: Props = $props()

	const enhancedImage = $derived(
		findEnhancedPersonImage(partialPath) as (string & Picture) | undefined,
	)
</script>

{#if enhancedImage}
	<enhanced:img src={enhancedImage} {...rest}></enhanced:img>
{:else if partialPath}
	<img src={partialPath} {...rest} />
{/if}
