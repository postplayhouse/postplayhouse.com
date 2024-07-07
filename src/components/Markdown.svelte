<script lang="ts" context="module">
	import { marked } from "marked"
	marked.setOptions({ smartypants: true })
</script>

<script lang="ts">
	let { source }: { source?: string } = $props()
</script>

<div class="via-markdown">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{#key source}
		{@html marked.parse(source || "")}
	{/key}
	{source}
	<br />
	<br />
	{marked.parse(source || "")}
</div>
