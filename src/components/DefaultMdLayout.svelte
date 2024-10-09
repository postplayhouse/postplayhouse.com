<script lang="ts">
	import type { Snippet } from "svelte"

	type Props = {
		title?: string
		css_class?: string
		children: Snippet
	}

	let { title = "", css_class = "", children }: Props = $props()
</script>

<article class="via-markdown {css_class}">
	{#if title}
		<h1 class="h1">{title}</h1>
	{/if}
	{@render children()}
</article>
