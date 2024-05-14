<script lang="ts">
	import Production from "$components/Production.svelte"
	import MaybeImage from "$components/MaybeImage.svelte"
	import TicketsButton from "$components/TicketsButton.svelte"
	import site, { ticketsAvailable } from "$data/site"
	import SponsorPlate from "$components/SponsorPlate.svelte"

	let { data } = $props()

	const { productions, year, series } = data

	const seasonImg = `/images/${year}/full-season.jpg`
</script>

<h1 class="h1">Summer {year} Productions</h1>

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

<div class="my-8">
	<SponsorPlate {year}>
		{#snippet beforeSponsors()}
			<h3 class="h3 text-center my-4">
				Special thanks to our Season Sponsors:
			</h3>
		{/snippet}
	</SponsorPlate>
</div>

<MaybeImage src="{[seasonImg]}" alt="All {year} productions" />

{#if ticketsAvailable() && site.season === year}
	<div class="my-4 text-center">
		Tickets are on sale now!
		<br />
		<br />
		<TicketsButton />
	</div>
{/if}

{#if site.showsAnnounced}
	{#if productions.length > 0}
		{#each productions as production}
			<Production {production} season="{year}" />
		{/each}

		{#each series as event}
			<Production production="{event}" season="{year}" />
		{/each}
	{:else if year > new Date().getFullYear()}
		<h2 class="text-xl text-center">
			Our shows for {year} have been announced, and this page will be updated soon...
		</h2>
	{/if}
{:else if year > new Date().getFullYear()}
	<h2 class="text-xl text-center">
		Our shows for {year} will be announced soon...
	</h2>
{:else}
	<h2 class="text-xl text-center">
		There is no historical production info for {year}
	</h2>
{/if}
