<script lang="ts">
	import type { Snippet } from "svelte"
	import type { Showing, SimpleDate } from "./calendarHelpers"

	import Day from "./Day.svelte"

	type Props = {
		days: Array<{
			date: SimpleDate
			showings: Showing[]
		}>
		padStartCount?: number
		children: Snippet
	}

	let { days, padStartCount = 0, children }: Props = $props()
</script>

<ul class="week">
	{#if padStartCount}
		<li class="day padding">
			{@render children()}
		</li>
	{/if}
	{#each days as day}
		<Day date={day.date} daySchedule={day.showings} />
	{/each}
</ul>
