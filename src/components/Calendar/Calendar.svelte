<script lang="ts">
	import Week from "./Week.svelte"
	import { getWeeksFromProductions } from "./calendarHelpers"
	export let productions: Production[]
	export let year: Date.Year

	const weekData = getWeeksFromProductions(productions, year)
</script>

<svelte:head>
	<style>
		main {
			max-width: 70em !important;
		}
	</style>
	<link rel="stylesheet" href="/calendar.css" />
</svelte:head>

<div class="calendar-component-wrapper">
	<div class="proportional-wrapper">
		<div class="outer">
			<div class="inner">
				<div class="calendar calendar-{year}">
					{#each weekData as week, i}
						<Week days="{week}" padStartCount="{i === 0 ? 5 : 0}">
							{#if i === 0}
								<div class="calendar-filters">
									{#each productions as prod, i}
										<div class="filter selected show-{prod.color}">
											{prod.title}
										</div>
									{/each}
								</div>
							{/if}
						</Week>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
