<script lang="ts" module>
	import { marked } from "marked"
	import { onMount } from "svelte"
	marked.setOptions({ smartypants: true })
</script>

<script lang="ts">
	let { source }: { source?: string } = $props()
	let markdown = $derived(marked.parse(source || ""))
	let hydrated = $state(false)

	onMount(() => {
		hydrated = true
	})
</script>

<div class="via-markdown">
	{#if hydrated}
		{@html markdown}
	{:else}
		{@html markdown}
	{/if}
</div>
