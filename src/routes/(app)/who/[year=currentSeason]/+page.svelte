<script lang="ts">
	import PeoplePage from "../PeoplePage.svelte"

	let { data } = $props()
</script>

<PeoplePage {data} />
