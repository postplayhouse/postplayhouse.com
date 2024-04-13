<script lang="ts">
	export let href: string | undefined = undefined
	let className = ""
	export { className as class }
</script>

{#if href}
	<a {href} class="{className}"><slot /></a>
{:else}
	<span class="{className}"><slot /></span>
{/if}
