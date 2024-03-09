<script lang="ts">
	import Production from "$components/Production.svelte"
	import MaybeImage from "$components/MaybeImage.svelte"
	import TicketsButton from "$components/TicketsButton.svelte"
	import site, { ticketsAvailable } from "$data/site"

	export let data

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

{#if year === 2023 || year === 2024}
	<h3 class="h3 text-center">This season is sponsored by:</h3>
	<ul
		class="grid grid-cols-2 gap-4 justify-between list-none max-w-lg m-auto my-8 dark:bg-white/70 rounded p-4"
	>
		<li>
			<img src="/images/sponsors/csc.png" alt="Chadron State College" />
		</li>
		<li>
			<img
				src="/images/sponsors/security-first-bank.png"
				alt="Security First Bank"
			/>
		</li>
		<li class="col-span-2">
			<img
				src="/images/sponsors/casey-peterson-financial.png"
				alt="Casey Peterson Financial"
			/>
		</li>
	</ul>
{/if}

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
