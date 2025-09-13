<script lang="ts">
	import Production from "$components/Production.svelte"
	import TicketsButton from "$components/TicketsButton.svelte"
	import site, { ticketsAvailable } from "$data/site"
	import SponsorPlate from "$components/SponsorPlate.svelte"
	import SeasonImage from "$components/SeasonImage.svelte"

	let { data } = $props()

	let { productions, year, series } = $derived(data)
</script>

<h1 class="h1">Summer {year} Productions</h1>

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

{#if year !== site.season || site.showsAnnounced}
	<div class="my-8">
		<SponsorPlate {year}>
			{#snippet beforeSponsors()}
				<h3 class="h3 my-4 text-center">
					Special thanks to our Season Sponsors:
				</h3>
			{/snippet}
		</SponsorPlate>
	</div>

	<SeasonImage
		season={year}
		imageFile="full-season.jpg"
		alt="All {year} productions"
	/>
{/if}

{#if ticketsAvailable() && site.season === year}
	<div class="my-4 text-center">
		Tickets are on sale now!
		<br />
		<br />
		<TicketsButton />
	</div>
{/if}

{#if (site.showsAnnounced && year === site.season) || (year < site.season && productions.length > 0)}
	{#if productions.length > 0}
		{#each productions as production}
			<Production {production} season={year} />
		{/each}

		{#each series as event}
			<Production production={event} season={year} />
		{/each}
	{:else if year > new Date().getFullYear()}
		<h2 class="text-center text-xl">
			Our shows for {year} have been announced, and this page will be updated soon...
		</h2>
	{/if}
{:else if year > new Date().getFullYear()}
	<h2 class="text-center text-xl">
		Our shows for {year} will be announced soon...
	</h2>

	<p class="mt-4 text-center">
		Want to <a class="link-green" href="../{site.season - 1}"
			>see last season's productions</a
		>?
	</p>
{:else}
	<h2 class="text-center text-xl">
		There is no historical production info for {year}
	</h2>
{/if}
