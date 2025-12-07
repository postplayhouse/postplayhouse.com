<script lang="ts">
	import Openings from "$components/Openings/Openings.svelte"
	import * as site from "$data/site.js"
	import { formatDate, getDateFor, getToday } from "$helpers"
	import { addDays } from "date-fns"
	import { findClosingDate } from "./openings"

	type DateString = `${number}-${number}-${number}`

	type Props = {
		productions?: Production[]
		season?: Date.Year
	}

	let { productions = [], season = site.season }: Props = $props()
	let closingDate = $derived(findClosingDate(season, productions))

	let openings = $derived(productions.map((p) => p.opening as DateString))
	let fourDaysBeforeEachOpenings = $derived(
		openings
			.map((opening) => {
				const openingDate = getDateFor(opening)
				openingDate.setDate(openingDate.getDate() - 4)
				return openingDate.toISOString().split("T")[0] as DateString
			})
			.sort(),
	)
	let closingCountdown = Array.from({ length: 30 }, (_, i) => {
		return addDays(getDateFor(closingDate), -i)
			.toISOString()
			.split("T")[0] as DateString
	})
	const actualDate = getToday().toISOString().split("T")[0] as DateString

	let dates = $derived.by(() => {
		const oneDayAfterFinalOpening = addDays(
			getDateFor(openings[openings.length - 1]),
			1,
		)
			.toISOString()
			.split("T")[0] as DateString
		const oneDayAfterClosing = addDays(getDateFor(closingDate), 1)
			.toISOString()
			.split("T")[0] as DateString
		const tempDates = [
			actualDate,
			`${season}-01-01` as const,
			...openings,
			...fourDaysBeforeEachOpenings,
			oneDayAfterFinalOpening,
			...closingCountdown,
			oneDayAfterClosing,
		].sort()
		return [...new Set(tempDates)]
	})

	let datesIndex = $derived(dates.indexOf(actualDate))
	let date = $derived(dates[datesIndex])
</script>

<div class="hidden flex-wrap items-center justify-center gap-2 p-4 md:flex">
	{#each dates as oneDate}
		<button
			class="btn p-2"
			disabled={oneDate === date}
			onclick={() => (datesIndex = dates.indexOf(oneDate))}
			>{formatDate(oneDate, { skipYear: true })}</button
		>
	{/each}
</div>

<div class="text-center">
	Rendering as if it were {formatDate(date, { skipYear: true })}.
</div>

<div class="flex flex-wrap items-center justify-center gap-2 p-4">
	<button
		class="btn mx-auto mb-4 block p-2"
		onclick={() =>
			(datesIndex = (datesIndex - 1 + dates.length) % dates.length)}
		>PREV</button
	>
	<button
		class="btn mx-auto mb-4 block p-2"
		onclick={() => (datesIndex = dates.indexOf(actualDate))}
		>Reset to Today</button
	>
	<button
		class="btn mx-auto mb-4 block p-2"
		onclick={() => (datesIndex = (datesIndex + 1) % dates.length)}>NEXT</button
	>
</div>

<Openings {season} {productions} debugTodayString={date}></Openings>
