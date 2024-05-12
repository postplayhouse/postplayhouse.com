<script lang="ts">
	import { onMount } from "svelte"

	let srcIn: string
	export { srcIn as src }
	export let alt: undefined | string = undefined

	let loading = true

	function getSources(src: string): string[] {
		if (!src.startsWith("/images")) return [src]
		const original = src
		const fullSize = `/g${src}`

		return [fullSize, original]
	}

	const potentialSources = getSources(srcIn)

	let currentIndex = 0
	$: src = potentialSources[currentIndex]

	function nextSrc() {
		if (potentialSources.length < 2) return
		const nextIndex = (currentIndex + 1) % potentialSources.length

		// prevent an infinite loop of errors
		if (nextIndex > 0) currentIndex = nextIndex
	}

	let isMounted = false

	$: {
		if (isMounted) {
			const img = new Image()
			img.src = src
			loading = true

			img.onload = () => {
				loading = false
			}
			img.onerror = () => {
				loading = false
				nextSrc()
			}
		}
	}

	onMount(() => {
		isMounted = true
	})
</script>

{#if loading}
	<div class="flex justify-center items-center h-32">
		<div
			class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"
		></div>
	</div>
{:else}
	<img {src} {alt} {...$$restProps} />
{/if}
