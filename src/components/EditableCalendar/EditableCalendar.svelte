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
	import { add, getWeek } from "date-fns"
	import { browser } from "$app/environment"
	import { combine } from "$helpers"

	// Bare reference to page just to keep eslint happy
	// https://github.com/sveltejs/eslint-plugin-svelte/issues/652
	page

	$effect(replaceAfterMount)

	let dates = $derived(Array.from(makeDateIterator($schedule)))

	let isEditing = $state(false)

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

	const getPerfRow =
		(numPerfs: number, isEditing: boolean) => (performanceSlot: number) =>
			numPerfs === 3 || isEditing
				? (performanceSlot - 1) * 4 + 2
				: (performanceSlot - 2) * 5 + 2 + 2
</script>

<div class="prose dark:prose-invert mb-8 space-y-8">
	<p class="text-xl bold">
		You can edit the calendar below by changing inputs and clicking on the show
		slots on the calendar itself.
	</p>

	<div class="mt-8 bg-gray-200 dark:bg-gray-200/20 rounded p-4 space-y-6">
		<p>
			<strong>When you are done</strong>, you can share your new calendar by
			copying and sharing the URL below.
		</p>

		<div class="not-prose bg-white/50 dark:bg-black/50 p-2">
			<code class="break-words font-bold">
				{#if browser}
					{$page.url.origin}{$page.url.pathname}{decodeURIComponent(
						$page.url.search,
					)}
				{/if}
			</code>
		</div>
		<button class="btn-p" onclick="{handleCopyUrl}"
			>Copy URL to clipboard</button
		>
		<p>
			(<strong> You HAVE to copy the URL to share. </strong> This thing does not
			save your work.)
		</p>
	</div>
</div>

<form onsubmit="{(e) => e.preventDefault()}" class="my-12">
	<div class="text-xl">Productions</div>
	<div class="opacity-50">
		You can change the title and color. (Probably just pick an abbreviated
		title.)
	</div>
	<div class="flex flex-wrap gap-4 my-4">
		{#each $schedule.productions as production, i}
			<div class="flex gap-1 flex-wrap">
				<label>
					<div class="opacity-50">Color</div>
					<input
						class="inline-block size-12 border border-gray-500 rounded cursor-pointer"
						type="color"
						value="#{production.color}"
						oninput="{(e) =>
							handleProductionDetailChange(
								i,
								'color',
							)(e.currentTarget.value.slice(1))}"
					/>
				</label>
				<label>
					<div class="opacity-50">Full Title</div>
					<input
						class="inline-block p-2 border border-gray-500 rounded shadow-inner bg-gray-100 dark:bg-gray-100/10"
						type="text"
						value="{production.longTitle}"
						oninput="{(e) =>
							handleProductionDetailChange(
								i,
								'longTitle',
							)(e.currentTarget.value)}"
					/>
				</label>
				<label>
					<div class="opacity-50">Short Title</div>
					<input
						class="inline-block p-2 border border-gray-500 rounded shadow-inner bg-gray-100 dark:bg-gray-100/10"
						type="text"
						value="{production.shortTitle}"
						oninput="{(e) =>
							handleProductionDetailChange(
								i,
								'shortTitle',
							)(e.currentTarget.value)}"
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
<button class="btn-p" onclick="{() => moveShows('days', -1)}">Back 1 Day</button
>
<button class="btn-p" onclick="{() => moveShows('days', 1)}"
	>Forward 1 Day</button
>
<button class="btn-p ml-8" onclick="{() => moveShows('years', -1)}"
	>Back 1 Year</button
>
<button class="btn-p" onclick="{() => moveShows('years', 1)}"
	>Forward 1 Year</button
>

<div class="text-2xl bold mt-12 text-center mb-6">
	Summer
	{dates[0]?.year}
	{dates[0]?.month}: {dates[0]?.monthName}
</div>

<button class="btn-p" onclick="{() => (isEditing = !isEditing)}">
	{isEditing ? "Stop Editing" : "Start Editing"}
</button>

<div
	class="grid grid-cols-[1fr_minmax(3em,max-content)_1fr_1fr_1fr_1fr_1fr] bg-gray-300 dark:bg-neutral-800 gap-1 border-4 border-gray-300 dark:border-neutral-800"
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
		{@const numPerfs = day.performances.length}
		{@const rowSpan = numPerfs === 3 || isEditing ? "row-span-4" : "row-span-5"}
		{@const isDark = day.performances.length === 0}
		{@const weekInt =
			getWeek(new Date(day.year, day.month - 1, day.day)) -
			getWeek(new Date(dates[0].year, dates[0].month - 1, dates[0].day))}
		{@const startRow = weekInt * 14 + 2}
		<div
			class="bg-white dark:bg-neutral-500 p-1 grid grid-rows-subgrid row-[span_14_/_span_14]"
			class:bg-opacity-60="{evenMonth && !isDark}"
			class:bg-opacity-20="{isDark}"
			class:dark:bg-opacity-60="{evenMonth && !isDark}"
			class:dark:bg-opacity-20="{isDark}"
			style="{combine(
				`grid-column-start: ${day.weekday};`,
				`grid-row-start: ${startRow};`,
			)}"
		>
			<div class="relative flex justify-end row-span-2 row-start-1 col-start-1">
				{#if day.day === 1 || i === 0}
					<div
						class="font-uber -rotate-12 scale-125 md:scale-[2] md:-translate-x-2 origin-top-left
						dark:[text-shadow:0.035em_0.035em_0px_rgba(0,0,0,.5),0.035em_0.07em_0px_rgba(0,0,0,.5),0_0_4px_rgba(0,0,0,.5)]"
					>
						<div class="hidden lg:block">{day.monthName}</div>
						<div class="lg:hidden">{day.monthName.slice(0, 3)}</div>
					</div>
				{/if}
				<div class="flex-grow"></div>
				{day.day}
			</div>

			{#each [1, 2, 3] as performanceSlot}
				{@const time =
					performanceSlot === 1 ? "10a" : performanceSlot === 2 ? "2p" : "8p"}
				{#each day.performances.filter((p) => p.slot === performanceSlot) as performance}
					<Dropdown
						class="
								{combine(
							'transition-opacity duration-300 w-full hover:opacity-25 col-start-1',
							'bg-opacity-100',
							rowSpan,
							'bg-[color-mix(in_srgb,transparent,var(--show-color)_calc(var(--tw-bg-opacity)*100%))] ring-inset data-[open]:ring-white data-[open]:ring data-[open]:bg-opacity-50 data-[open]:hover:opacity-100',
						)}"
						style="--show-color:#{performance.color}; grid-row-start: {getPerfRow(
							numPerfs,
							isEditing,
						)(performanceSlot)};"
						choices="{$schedule.productions}"
						current="{performance}"
						onChoice="{(production) =>
							handleChoice({
								...day,
								slot: performanceSlot,
								production,
							})}"
					>
						<div class="m-1 grid grid-cols-[2.2em_auto] gap-1">
							<div class="rounded px-1 bg-white/50 text-black text-right">
								{time}
							</div>
							<span
								class="text-white truncate
										[text-shadow:0.035em_0.035em_0px_color-mix(in_srgb,black_50%,var(--show-color)),0.035em_0.07em_0px_color-mix(in_srgb,black_50%,var(--show-color)),0_0_4px_color-mix(in_srgb,black_50%,var(--show-color))]"
							>
								{performance.shortTitle}
							</span>
						</div>
					</Dropdown>
				{:else}
					{#if isEditing}
						<Dropdown
							class="text-center
								transition-opacity duration-300 w-full opacity-0 hover:opacity-75 border border-gray-500 dark:border-white/50 border-dotted
								data-[open]:opacity-75"
							choices="{$schedule.productions}"
							onChoice="{(production) =>
								handleChoice({
									...day,
									slot: performanceSlot,
									production,
								})}"
						>
							Add {time}
						</Dropdown>
					{/if}
				{/each}
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
					<div class="text-2xl font-bold opacity-70 justify-self-end">
						{prod.performances.filter((x) => x.slot === 1).length}
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4 justify-end">
					2pm:
					<div class="text-2xl font-bold opacity-70 justify-self-end">
						{prod.performances.filter((x) => x.slot === 2).length}
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4 justify-end">
					8pm:
					<div class="text-2xl font-bold opacity-70 justify-self-end">
						{prod.performances.filter((x) => x.slot === 3).length}
					</div>
				</div>
				<div class="mt-4 grid grid-cols-2 gap-4 justify-end">
					total
					<div class="text-2xl font-bold opacity-70 justify-self-end">
						{prod.performances.length}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<h3 class="h2 mt-8">Performance Dates as push card info</h3>
	{#each perfsByProd as prod}
		<div class="text-3xl font-bold mt-4">
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
		<div class="text-3xl font-bold mt-4">
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
