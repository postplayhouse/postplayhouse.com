<script lang="ts">
	import { findEnhancedPersonImage, type Picture } from "$helpers/enhancedImg"
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
	<enhanced:img src="{enhancedImage}" {...rest}></enhanced:img>
{:else if partialPath}
	<img src="{partialPath}" {...rest} />
{/if}
