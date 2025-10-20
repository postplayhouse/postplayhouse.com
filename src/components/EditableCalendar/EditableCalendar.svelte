<script lang="ts">
	import Dropdown from "./Dropdown.svelte"
	import type { PerformanceDetails, ProductionDetails } from "./showingsData"
	import { dateOfPerformance, getDateDetails, makeDateIterator } from "./dates"
	import {
		addPerformance,
		editProduction,
		removePerformanceBySlot,
	} from "./changeset"
	import schedule, { replaceAfterMount } from "./store.svelte"
	import { page } from "$app/stores"
	import { add } from "date-fns"
	import { browser } from "$app/environment"

	// Bare reference to page just to keep eslint happy
	// https://github.com/sveltejs/eslint-plugin-svelte/issues/652
	page

	$effect(replaceAfterMount)

	let dates = $derived(Array.from(makeDateIterator($schedule)))

	const perfsByProd = $derived(
		$schedule.productions
			.map((x) => ({ ...x, id: x.shortTitle }))
			.map((x) => ({
				...x,
				performances: $schedule.performances.filter((y) => y.id === x.id),
			})),
	)

	function handleChoice(
		choice: Omit<PerformanceDetails, "id"> & {
			production: ProductionDetails | null
		},
	) {
		let tempSchedule = removePerformanceBySlot($schedule, choice)

		if (choice.production) {
			const { production, ...rest } = choice
			tempSchedule = addPerformance(tempSchedule, {
				...rest,
				id: production.shortTitle,
			})
		}

		schedule.set(tempSchedule)
	}

	function handleCopyUrl() {
		const url = new URL(window.location.toString())
		window.navigator.clipboard.writeText(
			url.origin + url.pathname + decodeURIComponent(url.search),
		)
	}

	function moveShows(slot: keyof Parameters<typeof add>[1], distance: number) {
		const newPerfs: PerformanceDetails[] = $schedule.performances.map(
			(perf) => {
				const date = dateOfPerformance(perf)
				const newDate = add(date, { [slot]: distance })
				const newDetails = getDateDetails(newDate)
				return { ...perf, ...newDetails }
			},
		)
		schedule.set({ ...$schedule, performances: newPerfs })
	}

	function handleProductionDetailChange(
		i: number,
		property: keyof ProductionDetails,
	) {
		return (newValue: string) => {
			const { performances, productions } = editProduction(
				$schedule,
				$schedule.productions[i],
				{
					[property]: newValue,
				},
			)

			schedule.set({ performances, productions })
		}
	}

	function slotToWebCode(slot: number) {
		switch (slot) {
			case 1:
				return "m"
			case 2:
				return "a"
			case 3:
				return "e"
			default:
				return "WTF"
		}
	}

	function slotToPushCardSymbol(slot: number) {
		switch (slot) {
			case 1:
				return "‡"
			case 2:
				return "*"
			case 3:
				return ""
			default:
				return "WTF"
		}
	}
</script>

<div class="prose dark:prose-invert mb-8 space-y-8">
	<p class="bold text-xl">
		You can edit the calendar below by changing inputs and clicking on the show
		slots on the calendar itself.
	</p>

	<div class="mt-8 space-y-6 rounded-sm bg-gray-200 p-4 dark:bg-gray-200/20">
		<p>
			<strong>When you are done</strong>, you can share your new calendar by
			copying and sharing the URL below.
		</p>

		<div class="not-prose bg-white/50 p-2 dark:bg-black/50">
			<code class="font-bold break-words!">
				{#if browser}
					{$page.url.origin}{$page.url.pathname}{decodeURIComponent(
						$page.url.search,
					)}
				{/if}
			</code>
		</div>
		<button class="btn-p" onclick={handleCopyUrl}>Copy URL to clipboard</button>
		<p>
			(<strong> You HAVE to copy the URL to share. </strong> This thing does not
			save your work.)
		</p>
	</div>
</div>

<form onsubmit={(e) => e.preventDefault()} class="my-12">
	<div class="text-xl">Productions</div>
	<div class="opacity-50">
		You can change the title and color. (Probably just pick an abbreviated
		title.)
	</div>
	<div class="my-4 flex flex-wrap gap-4">
		{#each $schedule.productions as production, i}
			<div class="flex flex-wrap gap-1">
				<label>
					<div class="opacity-50">Color</div>
					<input
						class="inline-block size-12 cursor-pointer rounded border border-gray-500"
						type="color"
						value="#{production.color}"
						oninput={(e) =>
							handleProductionDetailChange(
								i,
								"color",
							)(e.currentTarget.value.slice(1))}
					/>
				</label>
				<label>
					<div class="opacity-50">Full Title</div>
					<input
						class="inline-block rounded border border-gray-500 bg-gray-100 p-2 shadow-inner dark:bg-gray-100/10"
						type="text"
						value={production.longTitle}
						oninput={(e) =>
							handleProductionDetailChange(
								i,
								"longTitle",
							)(e.currentTarget.value)}
					/>
				</label>
				<label>
					<div class="opacity-50">Short Title</div>
					<input
						class="inline-block rounded border border-gray-500 bg-gray-100 p-2 shadow-inner dark:bg-gray-100/10"
						type="text"
						value={production.shortTitle}
						oninput={(e) =>
							handleProductionDetailChange(
								i,
								"shortTitle",
							)(e.currentTarget.value)}
					/>
				</label>
			</div>
		{/each}
	</div>
</form>

<div class="mt-12 mb-4">
	Use these buttons to move dates to match the year you are working on. <div
		class="opacity-50"
	>
		(When you move a year, the days will be off by one, and you'll use the day
		adjustments to realign)
	</div>
</div>
<button class="btn-p" onclick={() => moveShows("days", -1)}>Back 1 Day</button>
<button class="btn-p" onclick={() => moveShows("days", 1)}>Forward 1 Day</button
>
<button class="btn-p ml-8" onclick={() => moveShows("years", -1)}
	>Back 1 Year</button
>
<button class="btn-p" onclick={() => moveShows("years", 1)}
	>Forward 1 Year</button
>

<div class="bold mt-12 mb-6 text-center text-2xl">
	Summer
	{dates[0]?.year}
</div>

<div
	class="grid grid-cols-[1fr_auto_1fr_1fr_1fr_1fr_1fr] gap-1 border-4 border-gray-300 bg-gray-300 dark:border-neutral-800 dark:bg-neutral-800"
>
	<div class="text-center">Sun</div>
	<div class="text-center">Mon</div>
	<div class="text-center">Tue</div>
	<div class="text-center">Wed</div>
	<div class="text-center">Thu</div>
	<div class="text-center">Fri</div>
	<div class="text-center">Sat</div>

	{#each dates as day, i}
		{@const evenMonth = day.month % 2 === 0}
		{@const isDark = day.performances.length === 0}
		<div
			class="bg-white p-1 dark:bg-neutral-500"
			class:bg-opacity-60={evenMonth && !isDark}
			class:bg-opacity-20={isDark}
			class:dark:bg-opacity-60={evenMonth && !isDark}
			class:dark:bg-opacity-20={isDark}
			style={i === 0 ? "grid-column-start: " + day.weekday : ""}
		>
			<div class="relative flex justify-end">
				{#if day.day === 1 || i === 0}
					<div
						class="font-uber origin-top-left scale-125 -rotate-12 md:-translate-x-2 md:scale-[2]
						dark:[text-shadow:0.035em_0.035em_0px_rgba(0,0,0,.5),0.035em_0.07em_0px_rgba(0,0,0,.5),0_0_4px_rgba(0,0,0,.5)]"
					>
						<div class="hidden lg:block">{day.monthName}</div>
						<div class="lg:hidden">{day.monthName.slice(0, 3)}</div>
					</div>
				{/if}
				<div class="grow"></div>
				{day.day}
			</div>

			{#each [1, 2, 3] as performanceSlot}
				{@const time =
					performanceSlot === 1 ? "10a" : performanceSlot === 2 ? "2p" : "8p"}
				<div class="h-8">
					{#each day.performances.filter((p) => p.slot === performanceSlot) as performance}
						<Dropdown
							class="
								bg-opacity-100 data-[open]:bg-opacity-50 h-full w-full bg-[color-mix(in_srgb,transparent,var(--show-color)_calc(var(--tw-bg-opacity,1)*100%))]
								transition-opacity
								duration-300 ring-inset hover:opacity-25 data-[open]:ring data-[open]:ring-white data-[open]:hover:opacity-100"
							style="--show-color:#{performance.color}"
							choices={$schedule.productions}
							current={performance}
							onChoice={(production) =>
								handleChoice({
									...day,
									slot: performanceSlot,
									production,
								})}
						>
							<div class="m-1 grid grid-cols-[2.2em_auto] gap-1">
								<div class="rounded bg-white/50 px-1 text-right text-black">
									{time}
								</div>
								<span
									class="truncate text-white
										[text-shadow:0.035em_0.035em_0px_color-mix(in_srgb,black_50%,var(--show-color)),0.035em_0.07em_0px_color-mix(in_srgb,black_50%,var(--show-color)),0_0_4px_color-mix(in_srgb,black_50%,var(--show-color))]"
								>
									{performance.shortTitle}
								</span>
							</div>
						</Dropdown>
					{:else}
						<Dropdown
							class="text-center
								transition-opacity duration-300 h-full w-full opacity-20 hover:opacity-75 border border-gray-500 dark:border-white/50 border-dotted
								data-[open]:opacity-75"
							choices={$schedule.productions}
							onChoice={(production) =>
								handleChoice({
									...day,
									slot: performanceSlot,
									production,
								})}
						>
							Add {time}
						</Dropdown>
					{/each}
				</div>
			{/each}
		</div>
	{/each}
</div>

<div class="mt-12">
	<h2 class="h1">Details</h2>
	<h3 class="h2 mt-4">Performance Counts</h3>
	<div class="mt-6 flex justify-between tabular-nums">
		{#each perfsByProd as prod}
			<div>
				<div class="text-3xl font-bold">
					{prod.longTitle}
				</div>

				<div class="grid grid-cols-2 justify-end">
					10am:
					<div class="justify-self-end text-2xl font-bold opacity-70">
						{prod.performances.filter((x) => x.slot === 1).length}
					</div>
				</div>
				<div class="grid grid-cols-2 justify-end gap-4">
					2pm:
					<div class="justify-self-end text-2xl font-bold opacity-70">
						{prod.performances.filter((x) => x.slot === 2).length}
					</div>
				</div>
				<div class="grid grid-cols-2 justify-end gap-4">
					8pm:
					<div class="justify-self-end text-2xl font-bold opacity-70">
						{prod.performances.filter((x) => x.slot === 3).length}
					</div>
				</div>
				<div class="mt-4 grid grid-cols-2 justify-end gap-4">
					total
					<div class="justify-self-end text-2xl font-bold opacity-70">
						{prod.performances.length}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<h3 class="h2 mt-8">Performance Dates as push card info</h3>
	{#each perfsByProd as prod}
		<div class="mt-4 text-3xl font-bold">
			{prod.longTitle}
		</div>

		{#if prod.performances.filter((x) => x.month === 5).length > 0}
			<div class="">
				May
				<span class="">
					{#each prod.performances.filter((x) => x.month === 5) as perf}
						{perf.day}{slotToPushCardSymbol(perf.slot)},{" "}
					{/each}
				</span>
			</div>
		{/if}

		<div class="">
			June
			<span class="">
				{#each prod.performances.filter((x) => x.month === 6) as perf}
					{perf.day}{slotToPushCardSymbol(perf.slot)},{" "}
				{/each}
			</span>
		</div>
		<div class="">
			July
			<span class="">
				{#each prod.performances.filter((x) => x.month === 7) as perf}
					{perf.day}{slotToPushCardSymbol(perf.slot)},{" "}
				{/each}
			</span>
		</div>
		<div class="">
			August
			<span class="">
				{#each prod.performances.filter((x) => x.month === 8) as perf}
					{perf.day}{slotToPushCardSymbol(perf.slot)},{" "}
				{/each}
			</span>
		</div>
	{/each}

	<h3 class="h2 mt-8">Performance Dates as website data</h3>
	{#each perfsByProd as prod}
		<div class="mt-4 text-3xl font-bold">
			{prod.longTitle}
		</div>

		{#if prod.performances.filter((x) => x.month === 5).length > 0}
			<div class="">
				May
				<span class="">
					{#each prod.performances.filter((x) => x.month === 5) as perf}
						{perf.day}{slotToWebCode(perf.slot)},{" "}
					{/each}
				</span>
			</div>
		{/if}

		<div class="">
			June
			<span class="">
				{#each prod.performances.filter((x) => x.month === 6) as perf}
					{perf.day}{slotToWebCode(perf.slot)},{" "}
				{/each}
			</span>
		</div>
		<div class="">
			July
			<span class="">
				{#each prod.performances.filter((x) => x.month === 7) as perf}
					{perf.day}{slotToWebCode(perf.slot)},{" "}
				{/each}
			</span>
		</div>
		<div class="">
			August
			<span class="">
				{#each prod.performances.filter((x) => x.month === 8) as perf}
					{perf.day}{slotToWebCode(perf.slot)},{" "}
				{/each}
			</span>
		</div>
	{/each}
</div>
