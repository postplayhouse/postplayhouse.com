<script lang="ts">
	import OpeningsDebugger from "$components/Openings/OpeningsDebugger.svelte"
	import ActiveColors from "./ActiveColors.svelte"

	let { data } = $props()
	const { productions } = data
</script>

<details>
	<summary>
		<h2 class="h2">Active Colors</h2>
	</summary>
	<ActiveColors />
</details>

<h2 class="h2 mt-8">Automatic openings widget</h2>
<div class="mx-auto mb-16 max-w-3xl p-2">
	<OpeningsDebugger {productions} />
</div>
