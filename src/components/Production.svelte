<script lang="ts">
	import { formatDate } from "$helpers"
	import { findEnhancedSeasonImage, type Picture } from "$helpers/enhancedImg"

	import Markdown from "./Markdown.svelte"
	import MaybeImage from "./MaybeImage.svelte"
	import MaybeLink from "./MaybeLink.svelte"
	import ProductionImage from "./SeasonImage.svelte"

	type Props = {
		production: Production | SpecialEvent | Series
		season: Date.Year
	}

	let { production, season }: Props = $props()

	const enhancedImage = $derived(
		production &&
			(findEnhancedSeasonImage(production.image) as
				| (string & Picture)
				| undefined),
	)
	const image = $derived(production && production.image)

	function isSeries(
		production: Production | SpecialEvent | Series,
	): production is Series {
		return "events" in production
	}
</script>

<article class="mt-16 flow-root">
	<header>
		{#if enhancedImage}
			<ProductionImage
				class="block max-w-full bg-white/70 md:float-left md:mr-4 md:w-3/5 md:max-w-4xl"
				imageFile="{production.image}"
				{season}
				alt="Show Logo for {production.title}"
			></ProductionImage>
		{:else if image}
			<MaybeImage
				class="block max-w-full bg-white/70 md:float-left md:mr-4 md:w-3/5 md:max-w-4xl"
				src="{[image]}"
				alt="Show Logo for {production.title}"
			/>
		{/if}
		<h2 class="mb-2 text-4xl leading-none">
			{#if production.pre_title}
				<div class="text-lg leading-none">{production.pre_title}</div>
			{/if}
			{production.title}
		</h2>
	</header>

	{#if production.opening}
		<div class="font-bold">
			Opens {formatDate(production.opening, { prependWeekday: true })}
		</div>
	{/if}
	{#if production.writers}
		<!-- Making every paragraph a flex box ensures that the position and name of
  the person will not flow differently around the floated show logo -->
		<div class="writers mb-8 [&_p]:flex">
			<Markdown source="{production.writers}" />
		</div>
	{/if}
	{#if production.rating}
		<div>
			<a class="link-green" href="/ratings">Rating: {production.rating}</a>
			{#if production.rating_explanation}
				<div
					class="my-2 bg-grey-200 p-4 text-grey-600 dark:bg-grey-200/40 dark:text-white"
				>
					{production.rating_explanation}
				</div>
			{/if}
		</div>
	{/if}

	<div>
		<Markdown source="{production.description}" />

		{#if production.sponsor}
			<MaybeLink
				class="float-right p-2 dark:bg-white/50"
				href="{production.sponsor.link}"
			>
				<p>Sponsored By</p>
				{#if production.sponsor.image}
					<img
						class="block w-48 max-w-full"
						alt="sponsor logo"
						src="/images/sponsors/{production.sponsor.image}"
					/>
				{:else if production.sponsor.text}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<span class="text-3xl font-bold">{@html production.sponsor.text}</span
					>
				{/if}
			</MaybeLink>
		{/if}
	</div>

	{#if isSeries(production)}
		<div class="border-l-8 pl-8">
			{#each production.events as event}
				<svelte:self production="{event}" {season} />
			{/each}
		</div>
	{/if}
</article>

<style>
	@media screen and (max-width: 767px) {
		/* A little hack to make better use of whitespace on smaller screens */
		.writers :global(.via-markdown) {
			display: flex;
			justify-content: space-around;
			flex-wrap: wrap;
		}
	}
</style>
