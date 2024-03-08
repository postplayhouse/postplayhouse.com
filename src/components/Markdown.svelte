<script lang="ts" context="module">
	import { marked } from "marked"
	marked.setOptions({ smartypants: true })
</script>

<script lang="ts">
	export let source: string
</script>

<div class="via-markdown">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html marked.parse(source)}
</div>
