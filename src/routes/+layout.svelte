<script lang="ts">
	type Props = { children?: import("svelte").Snippet }
	let { children }: Props = $props()
	import "../app.css"
</script>

{@render children?.()}
