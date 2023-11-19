<script lang="ts" context="module">
	import { marked } from "marked"
	marked.setOptions({ smartypants: true })
</script>

<script lang="ts">
	export let source
</script>

<div class="via-markdown">
	{@html marked.parse(source)}
</div>
