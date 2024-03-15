<script lang="ts">
	export let title = ""
</script>

<article class="via-markdown">
	{#if title}
		<h1 class="h1">{title}</h1>
	{/if}
	<slot />
</article>
