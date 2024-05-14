<script lang="ts">
	import { onMount } from "svelte"
	import type { HTMLImgAttributes } from "svelte/elements"

	type Props = Omit<HTMLImgAttributes, "src"> & { src: string | string[] }
	const { src, ...rest }: Props = $props()

	function checkImageExists(imageSrc: string) {
		return new Promise((res) => {
			var img = new Image()
			img.onload = () => res(true)
			img.onerror = () => res(false)
			img.src = imageSrc
		})
	}

	// The lowest index for src wins
	let winningSrc = $state(undefined as string | undefined)

	// We render nothing unless mounted in the client. SSR will result in lots of
	// thrown error noise
	onMount(async () => {
		const sources = Array.isArray(src) ? src : [src]

		for (const path of sources) {
			if (path.startsWith("data:")) {
				winningSrc = path
				break
			}
			if (await checkImageExists(path)) {
				winningSrc = path
				break
			}
		}

		if (!winningSrc) {
			console.warn(`No image found for ${sources.join()}`)
		}
	})
</script>

{#if winningSrc}<img src="{winningSrc}" {...rest} />{/if}
