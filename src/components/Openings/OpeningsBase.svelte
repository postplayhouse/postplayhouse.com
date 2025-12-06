<script lang="ts">
	import {
		diffDays,
		formatDate,
		getDateFor,
		getToday,
		nonValueToEmptyStr,
	} from "$helpers"
	import type { Snippet } from "svelte"
	import { weekdays } from "../Calendar/calendarHelpers"

	import Markdown from "../Markdown.svelte"
	import SponsorPlate from "../SponsorPlate.svelte"
	import TicketsButton from "../TicketsButton.svelte"
	import DynamicCurrentSeasonImage from "../DynamicCurrentSeasonImage.svelte"
	import { findClosingDate } from "./openings"
	import z from "zod"

	const guaranteedOpeningSchema = z.array(
		z.looseObject({
			opening: z.iso.date(),
		}),
	)

	function assertProdsHaveOpenings<P>(
		productions: P[],
	): asserts productions is (P & { opening: string })[] {
		guaranteedOpeningSchema.parse(productions)
	}

	type Props = {
		season: Date.Year
		productions?: Production[]
		/** YYYY-MM-DD : Use this to view the component's state on a given date*/
		debugTodayString?: `${number}-${number}-${number}`
		ticketAvailability?: Snippet
		seasonArtworkImage?: Snippet
	}

	let {
		season,
		productions = [],
		debugTodayString,
		seasonArtworkImage,
		ticketAvailability,
	}: Props = $props()

	assertProdsHaveOpenings(productions)

	let closingDate = $derived(findClosingDate(season, productions))

	let today = $derived(
		debugTodayString ? getDateFor(debugTodayString) : getToday(),
	)
	let now = $derived(
		debugTodayString ? getDateFor(debugTodayString) : new Date(),
	)

	let daysToClosing = $derived(diffDays(today, getDateFor(closingDate)))
	let isBeforeClosing = $derived(daysToClosing >= 0)
	let isAfterClosing =
		// 4pm MDT
		$derived(now > new Date(`${closingDate}T16:00:00.000-06:00`))

	let enhancedProductions = $derived(
		productions
			.map((p) => ({
				...p,
				daysUntilOpening: diffDays(today, getDateFor(p.opening)),
				dayOfWeek: weekdays[getDateFor(p.opening).getDay()],
				season: getDateFor(p.opening).getFullYear(),
			}))
			.sort((a, b) => a.daysUntilOpening - b.daysUntilOpening),
	)

	let openingSoon: (typeof enhancedProductions)[0] | undefined = $derived(
		enhancedProductions
			// Nothing that is already open
			.filter((p) => p.daysUntilOpening > -1)
			// Things that open in the next 4 days. Historically, this has always been a
			// Monday (4 days before Friday).
			.filter((p) => p.daysUntilOpening <= 4)[0],
	)

	let nowRunning = $derived(
		enhancedProductions.filter((p) => p.daysUntilOpening <= 0),
	)
	let notYetOpen = $derived(
		enhancedProductions.filter((p) => p.daysUntilOpening > 0),
	)

	let allShowsAreRunning = $derived(
		isBeforeClosing && !enhancedProductions.find((p) => p.daysUntilOpening > 0),
	)
</script>

<!-- Attempt to ensure that all Season Images are built, but all are hidden here. See commit message. -->
<DynamicCurrentSeasonImage class="mb-8" imageFile={undefined} />

{#if isAfterClosing}
	<h3 class="h1 my-8">Thank you for a wonderful season!</h3>

	<p class="my-8 text-3xl">
		We were delighted to bring you a summer season full of entertainment!
	</p>
{/if}
{#if openingSoon}
	<h3 class="h1 font-uber">
		{openingSoon.title} opens {openingSoon.daysUntilOpening > 0
			? `on ${openingSoon.dayOfWeek}`
			: "today"}!
	</h3>

	<div class="my-8 items-center md:flex">
		<div class="shrink">
			<DynamicCurrentSeasonImage
				imageFile={openingSoon.image}
				alt="Show Logo for {openingSoon.title}"
			/>
		</div>
		<div class="shrink-0 text-center md:text-left">
			<Markdown source={openingSoon.writers || undefined} />
		</div>
	</div>

	<Markdown source={openingSoon.description} />

	<div class="m-4 flex justify-center">
		<TicketsButton />
	</div>
{/if}

{#if daysToClosing < 30 && isBeforeClosing}
	<div class="my-12">
		<h3 class="h1 mb-4">Hurry, time is running out!</h3>
		{#if daysToClosing > 1}
			<p class="text-2xl">
				There are only <span class="text-3xl font-bold"
					>{daysToClosing} more days</span
				>
				until our final performance on {formatDate(closingDate, {
					skipYear: true,
				})}!
			</p>
		{:else if daysToClosing === 1}
			<p class="h3 text-center">Tomorrow is our final performance!</p>
		{:else if daysToClosing === 0}
			<p class="h3 text-center">
				Today is your last chance to see us this summer!
			</p>
		{/if}
		{@render ticketAvailability?.()}
	</div>
{/if}

{#if enhancedProductions.length > 0}
	<h3 class="h1 my-8">
		Our {nonValueToEmptyStr(enhancedProductions.at(0)?.season)} Summer Season
	</h3>

	{#if !allShowsAreRunning && nowRunning.length > 0 && isBeforeClosing}
		<div>
			<div class="mb-8 flex flex-wrap justify-center gap-12 *:w-fit *:shrink-0">
				<div>
					<h4 class="h2">Now running:</h4>
					<ul class="list-none pl-2">
						{#each nowRunning as production}
							<li class="">
								✅ {production.title}
							</li>
						{/each}
					</ul>
				</div>
				<div>
					<h4 class="h2">Opening Soon:</h4>
					<ul class="list-none pl-2">
						{#each notYetOpen as production}
							<li class="">
								⏳ {production.title} - {formatDate(production.opening, {
									skipYear: true,
								})}
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	{/if}

	<div class="mb-12">
		<SponsorPlate>
			{#snippet beforeSponsors()}
				<h3 class="h3 mb-4 text-center">
					Special thanks to our Season Sponsors:
				</h3>
			{/snippet}
		</SponsorPlate>
	</div>

	{#if allShowsAreRunning}
		<div class="my-8 text-center text-3xl">All shows are now running!</div>
	{/if}

	{@render seasonArtworkImage?.()}

	{#if isBeforeClosing}
		<div class="my-12 flex justify-center">
			<TicketsButton />
		</div>
	{/if}
{/if}
