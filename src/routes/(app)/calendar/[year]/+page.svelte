<script lang="ts">
	import Calendar from "$components/Calendar/Calendar.svelte"
	import site from "$data/site"

	export let data

	const { productions, year } = data

	const hasCalendar = !!productions?.find((prod) => prod.dates)
</script>

<h1 class="text-center font-uber text-4xl mb-2">{year} Season</h1>

{#if year === 2020}
	<h3 class="h3 text-center">
		The 2020 Season was cancelled before it began due to COVID-19.
	</h3>
	<p class="text-xl text-center mb-4">
		The calendar is reproduced below as the season was originally scheduled.
	</p>
{/if}

{#if year === 2021}
	<h3 class="h3 text-center">The 2021 Season was cancelled due to COVID-19.</h3>
{/if}

{#if hasCalendar}
	<Calendar {productions} {year} />
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
