<script lang="ts">
	type Props = { children?: import("svelte").Snippet }
	let { children }: Props = $props()
	import "../app.pcss"
</script>

{@render children?.()}
