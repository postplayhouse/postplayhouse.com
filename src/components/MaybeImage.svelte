<script lang="ts">
	import { onMount } from "svelte"
	export let src: string[] = []

	const { src: _, alt, ...rest } = $$props

	if (!Array.isArray(src)) {
		src = [src]
	}

	function checkImageExists(imageSrc: string) {
		return new Promise((res) => {
			var img = new Image()
			img.onload = () => res(true)
			img.onerror = () => res(false)
			img.src = imageSrc
		})
	}

	// The lowest index for src wins
	$: winningSrc = undefined as string | undefined

	// We render nothing unless mounted in the client. SSR will result in lots of
	// thrown error noise
	onMount(async () => {
		for (const path of src) {
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
			console.warn(`No image found for ${src.join()}`)
		}
	})
</script>

{#if winningSrc}<img src="{winningSrc}" {alt} {...rest} />{/if}
