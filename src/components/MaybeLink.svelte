<script lang="ts">
	import type { Snippet } from "svelte"

	type Props = {
		class?: string
		href?: string
		children: Snippet
	}

	let { class: className, href, children }: Props = $props()
</script>

{#if href}
	<a {href} class="{className}">{@render children()}</a>
{:else}
	<span class="{className}">{@render children()}</span>
{/if}
