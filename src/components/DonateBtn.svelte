<script lang="ts">
	import type { Snippet } from "svelte"
	type Props = { children?: Snippet }
	let { children }: Props = $props()
</script>

<div class="my-8 flex items-center justify-center">
	<a
		href="https://www.eleoonline.net/Pages/WebForms/Mobile/ShowFormMobile.aspx?id=c2261d4e-b066-44c5-a26f-fea98d07a3f3&linkto=670"
		target="_blank"
		rel="noopener noreferrer"
		class="btn btn-p inline-block"
		>{#if children}{@render children()}{:else}Donate Online Now{/if}</a
	>
</div>
