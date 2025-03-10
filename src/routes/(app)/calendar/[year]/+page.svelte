<script lang="ts">
	import Calendar from "$components/Calendar/Calendar.svelte"
	import Markdown from "$components/Markdown.svelte"
	import site from "$data/site"

	let { data } = $props()

	const { productions, series, specialEvents, year } = data

	const hasCalendar = !!productions?.find((prod) => prod.dates)

	const allSpecialEvents = [
		...series.map((s) => s.events).flat(),
		...specialEvents,
	].flat()
</script>

<h1 class="h1 mb-2">{year} Season</h1>

{#if year === 2020}
	<h3 class="h3 text-center">
		The 2020 Season was cancelled before it began due to COVID-19.
	</h3>
	<p class="mb-4 text-center text-xl">
		The calendar is reproduced below as the season was originally scheduled.
	</p>
{/if}

{#if year === 2021}
	<h3 class="h3 text-center">The 2021 Season was cancelled due to COVID-19.</h3>
{/if}

{#if year === 2024}
	<h3 class="h3 border border-red-800 bg-red-400 p-4 text-center">
		NOTICE: We have unfortunately had to cancel the final 4 performances of this
		season. Our closing performance will be Honky Tonk Laundry at 2pm on Friday,
		August 9th.
	</h3>
{/if}

{#if hasCalendar}
	{#if allSpecialEvents.length > 0}
		<div class="text-lg">
			There are <a class="link-green" href="/productions/{year}"
				>{allSpecialEvents.length} special events</a
			>
			this year!

			<ul>
				{#each allSpecialEvents as event}
					<li><Markdown source={event.title} /></li>
				{/each}
			</ul>
		</div>
	{/if}
	<Calendar {productions} specialEvents={allSpecialEvents} {year} />
{:else if year > new Date().getFullYear() && site.showsAnnounced}
	<h2 class="text-center text-xl">Our {year} schedule will be up soon...</h2>
{:else if year > new Date().getFullYear()}
	<h2 class="text-center text-xl">
		Our {year} shows will be announced soon...
	</h2>
{:else}
	<h2 class="text-center text-xl">
		There is no historical calendar for {year}
	</h2>
{/if}

{#if year === 2024}
	<h3 class="h3 border border-red-800 bg-red-400 p-4 text-center">
		NOTICE: We have unfortunately had to cancel the final 4 performances of this
		season. Our closing performance will be Honky Tonk Laundry at 2pm on Friday,
		August 9th.
	</h3>
{/if}
