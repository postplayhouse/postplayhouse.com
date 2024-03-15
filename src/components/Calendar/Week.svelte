<script lang="ts">
	import type { Showing, SimpleDate } from "./calendarHelpers"

	import Day from "./Day.svelte"

	export let days: Array<{
		date: SimpleDate
		showings: Showing[]
	}>

	export let padStartCount = 0
</script>

<ul class="week">
	{#if padStartCount}
		<li class="day padding">
			<slot />
		</li>
	{/if}
	{#each days as day}
		<Day date="{day.date}" daySchedule="{day.showings}" />
	{/each}
</ul>
