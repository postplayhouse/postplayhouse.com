<script lang="ts">
	import CalendarBase from "./CalendarBase.svelte"

	type Props = {
		productions: Production[]
		specialEvents?: SpecialEvent[]
		year: Date.Year
	}

	let props: Props = $props()
</script>

<svelte:head>
	<style>
		main {
			max-width: 70em !important;
		}
	</style>
	<link rel="stylesheet" href="/calendar.css" />
</svelte:head>

<CalendarBase {...props} />
