<script lang="ts">
	import OpeningsDebugger from "$components/Openings/OpeningsDebugger.svelte"

	let { data } = $props()
	const { productions } = data
</script>

<div class="mx-auto mb-16 max-w-3xl p-2">
	<OpeningsDebugger {productions} />
</div>
