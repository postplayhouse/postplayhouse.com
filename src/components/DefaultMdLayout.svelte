<script lang="ts">
	import type { Snippet } from "svelte"

	type Props = {
		title?: string
		children: Snippet
	}

	let { title = "", children }: Props = $props()
</script>

<article class="via-markdown">
	{#if title}
		<h1 class="h1">{title}</h1>
	{/if}
	{@render children()}
</article>
