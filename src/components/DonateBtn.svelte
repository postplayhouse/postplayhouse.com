<script lang="ts">
	import type { Snippet } from "svelte"
	type Props = { children?: Snippet }
	let { children }: Props = $props()
</script>

<div class="my-8 flex items-center justify-center">
	<a
		href="https://webforms.eleoonline.com/FormDatas/350/7f924e41-8828-4325-88d2-aa5b49c31b43"
		target="_blank"
		rel="noopener noreferrer"
		class="btn btn-p inline-block"
		>{#if children}{@render children()}{:else}Donate Online Now{/if}</a
	>
</div>
