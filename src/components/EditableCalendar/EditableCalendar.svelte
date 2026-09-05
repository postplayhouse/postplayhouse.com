<script lang="ts">
	import Dropdown from "./Dropdown.svelte"
	import {
		scheduleWarnings,
		type PerformanceDetails,
		type ProductionDetails,
	} from "./showingsData"
	import { dateOfPerformance, getDateDetails, makeDateIterator } from "./dates"
	import {
		addPerformance,
		editProduction,
		removePerformanceBySlot,
	} from "./changeset"
	import schedule, { hasEdits, replaceAfterMount } from "./store.svelte"
	import { add } from "date-fns"
	import { ExMap } from "$helpers/map"

	$effect(replaceAfterMount)

	let dates = $derived(Array.from(makeDateIterator($schedule)))
	let editing = $state(false)
	let shareCopied = $state(false)
	let warningsExpanded = $state(false)
	let warnings = $derived(scheduleWarnings($schedule))
	let shareDialog: HTMLDialogElement

	const perfsByProd = $derived(
		$schedule.productions
			.map((x) => ({ ...x, id: x.shortTitle }))
			.map((x) => ({
				...x,
				performances: $schedule.performances.filter((y) => y.id === x.id),
			})),
	)

	const months = {
		5: "May",
		6: "June",
		7: "July",
		8: "August",
	} as const

	const perfsByMonthByProd = $derived(
		perfsByProd.map(
			({ performances, ...prod }) =>
				[
					prod,

					performances
						.reduce((acc, perf) => {
							acc.setOrGet(perf.month, []).push(perf)
							return acc
						}, new ExMap<number, PerformanceDetails[]>())
						.toEntriesArray()
						.map(
							([monthNum, perfs]) =>
								[months[monthNum as keyof typeof months], perfs] as const,
						),
				] as const,
		),
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

	function shareUrl() {
		const url = new URL(window.location.toString())
		return url.origin + url.pathname + decodeURIComponent(url.search)
	}

	function handleCopyUrl() {
		return window.navigator.clipboard.writeText(shareUrl())
	}

	async function handleShareCopy() {
		await handleCopyUrl()
		shareCopied = true
	}

	function performanceTime(slot: number) {
		return slot === 1 ? "10:00 AM" : slot === 2 ? "2:00 PM" : "8:00 PM"
	}

	function calendarText() {
		const lines = [
			`Post Playhouse Calendar — Summer ${dates[0]?.year ?? ""}`,
			"================================================",
			"",
			"SAVE THIS CALENDAR",
			"------------------",
			"Keep this URL to return to this calendar:",
			"",
			shareUrl(),
			"",
			"PERFORMANCE COUNTS",
			"------------------",
		]

		for (const production of perfsByProd) {
			lines.push(
				"",
				production.longTitle,
				`  10:00 AM: ${production.performances.filter((performance) => performance.slot === 1).length}`,
				`   2:00 PM: ${production.performances.filter((performance) => performance.slot === 2).length}`,
				`   8:00 PM: ${production.performances.filter((performance) => performance.slot === 3).length}`,
				`     Total: ${production.performances.length}`,
			)
		}

		lines.push("", "SHOW DATES AND TIMES", "--------------------")

		for (const [production, performancesByMonth] of perfsByMonthByProd) {
			lines.push("", production.longTitle)
			if (performancesByMonth.length === 0) {
				lines.push("  No performances")
				continue
			}

			for (const [month, performances] of performancesByMonth) {
				lines.push(`  ${month}`)
				for (const performance of performances) {
					const weekday = dateOfPerformance(performance).toLocaleDateString(
						"en-US",
						{ weekday: "long" },
					)
					const time =
						performance.slot === 3
							? ""
							: ` — ${performanceTime(performance.slot)}`
					lines.push(
						`    ${String(performance.day).padStart(2, " ")} ${weekday}${time}`,
					)
				}
			}
		}

		lines.push(
			"",
			"PUSH CARD DATES",
			"---------------",
			"‡ = 10:00 AM    * = 2:00 PM    No symbol = 8:00 PM",
		)

		for (const [production, performancesByMonth] of perfsByMonthByProd) {
			lines.push("", production.longTitle)
			if (performancesByMonth.length === 0) {
				lines.push("  No performances")
				continue
			}

			for (const [month, performances] of performancesByMonth) {
				lines.push(
					`  ${month}: ${performances
						.map(
							(performance) =>
								`${performance.day}${slotToPushCardSymbol(performance.slot)}`,
						)
						.join(", ")}`,
				)
			}
		}

		return lines.join("\n") + "\n"
	}

	function handleSaveFile() {
		const href = URL.createObjectURL(
			new Blob([calendarText()], { type: "text/plain;charset=utf-8" }),
		)
		const link = document.createElement("a")
		link.href = href
		link.download = `post-playhouse-calendar-${dates[0]?.year ?? "schedule"}.txt`
		link.click()
		link.remove()
		setTimeout(() => URL.revokeObjectURL(href))
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

{#if warnings.length > 0}
	<aside
		class="fixed right-4 bottom-14 z-[9998] max-w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-amber-500 bg-amber-50 text-amber-950 shadow-xl dark:bg-amber-950 dark:text-amber-50"
		aria-live="polite"
	>
		<button
			type="button"
			class="flex w-full items-center justify-between gap-4 p-3 text-left font-bold"
			aria-expanded={warningsExpanded}
			aria-controls="schedule-warnings"
			onclick={() => (warningsExpanded = !warningsExpanded)}
		>
			<span
				>⚠ {warnings.length} schedule {warnings.length === 1
					? "warning"
					: "warnings"}</span
			>
			<span aria-hidden="true">{warningsExpanded ? "−" : "+"}</span>
		</button>

		{#if warningsExpanded}
			<div
				id="schedule-warnings"
				class="max-h-[min(60vh,30rem)] overflow-y-auto border-t border-amber-500 p-3"
			>
				<p class="mb-2 font-bold">These dates look unusual:</p>
				<ul class="list-disc space-y-2 pl-5">
					{#each warnings as warning (warning.id)}
						<li>{warning.message}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</aside>
{/if}

<dialog
	bind:this={shareDialog}
	onclick={(event) => {
		if (event.target === event.currentTarget) shareDialog.close()
	}}
	onclose={() => (shareCopied = false)}
	class="m-auto max-w-lg rounded-lg border border-gray-400 bg-white p-6 text-gray-900 shadow-xl backdrop:bg-black/70 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
>
	<form method="dialog">
		<div class="flex items-start justify-between gap-4">
			<h2 class="text-2xl font-bold">Keep your calendar changes</h2>
			<button
				type="submit"
				aria-label="Close"
				class="flex size-8 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-neutral-800 dark:hover:text-white"
				>×</button
			>
		</div>
		<p class="my-4">
			This calendar does not save your work. The only way to return to these
			changes is to keep the calendar URL somewhere you won’t lose it.
		</p>
		<p>
			Copy the URL directly, or save a text file containing the URL, performance
			counts, show dates, and show times.
		</p>

		{#if shareCopied}
			<p class="mt-4 font-bold text-green-700" aria-live="polite">
				URL copied to clipboard.
			</p>
		{/if}

		<div class="mt-6 flex flex-wrap justify-end gap-2">
			<button
				type="submit"
				class="rounded-xs border border-gray-400 bg-transparent px-4 py-2 font-bold text-gray-700 hover:bg-gray-100 dark:border-neutral-500 dark:text-gray-200 dark:hover:bg-neutral-800"
				>Cancel</button
			>
			<button type="button" class="btn-p" onclick={handleShareCopy}
				>Copy address</button
			>
			<button type="button" class="btn-p" onclick={handleSaveFile}
				>Save file</button
			>
		</div>
	</form>
</dialog>

<section class="relative">
	<div
		class="pointer-events-none sticky top-[calc(100vh-5rem)] z-40 h-0 w-fit"
		style="transform: translateX(calc(-1 * (max(0px, (100vw - 64rem) / 2) + 1rem)))"
	>
		{#if $hasEdits}
			<button
				type="button"
				onclick={() => shareDialog.showModal()}
				class="btn-p pointer-events-auto absolute bottom-2 left-0 w-32 text-left text-sm leading-tight shadow"
			>
				Edited: share changes
			</button>
		{/if}

		<button
			type="button"
			role="switch"
			aria-label="Edit calendar"
			aria-checked={editing}
			onclick={() => (editing = !editing)}
			class="pointer-events-auto flex items-center gap-3 rounded-full border border-gray-400 bg-white px-4 py-3 font-bold text-gray-900 shadow-lg dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
		>
			<span>Edit</span>
			<span
				data-enabled={editing || undefined}
				aria-hidden="true"
				class="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors duration-200 data-enabled:bg-green-600 dark:bg-neutral-600"
			>
				<span
					data-enabled={editing || undefined}
					class="pointer-events-none inline-block size-6 translate-x-0 rounded-full bg-white shadow-sm transition-transform duration-200 data-enabled:translate-x-5"
				></span>
			</span>
		</button>
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
							disabled={!editing}
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
							disabled={!editing}
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
							disabled={!editing}
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
	<button
		class="btn-p"
		disabled={!editing}
		onclick={() => moveShows("days", -1)}>Back 1 Day</button
	>
	<button class="btn-p" disabled={!editing} onclick={() => moveShows("days", 1)}
		>Forward 1 Day</button
	>
	<button
		class="btn-p ml-8"
		disabled={!editing}
		onclick={() => moveShows("years", -1)}>Back 1 Year</button
	>
	<button
		class="btn-p"
		disabled={!editing}
		onclick={() => moveShows("years", 1)}>Forward 1 Year</button
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
								duration-300 ring-inset enabled:hover:opacity-25 data-[open]:ring data-[open]:ring-white data-[open]:hover:opacity-100"
								style="--show-color:#{performance.color}"
								choices={$schedule.productions}
								current={performance}
								disabled={!editing}
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
									data-[open]:opacity-75 {editing ? '' : 'invisible'}"
								choices={$schedule.productions}
								disabled={!editing}
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
</section>

<div class="mt-12">
	<h2 class="h1">Details</h2>
	<h3 class="h2 mt-4">Performance Counts</h3>

	<table class="table-auto border-collapse **:p-2">
		<thead>
			<tr>
				<th></th>
				<th>10am</th>
				<th>2pm</th>
				<th>8pm</th>
				<th>total</th>
			</tr>
		</thead>
		<tbody class="text-right text-lg tabular-nums">
			{#each perfsByProd as prod}
				<tr>
					<td class="!text-left">
						{prod.longTitle}
					</td>

					<td>
						{prod.performances.filter((x) => x.slot === 1).length}
					</td>
					<td>
						{prod.performances.filter((x) => x.slot === 2).length}
					</td>
					<td>
						{prod.performances.filter((x) => x.slot === 3).length}
					</td>
					<td>
						{prod.performances.length}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h3 class="h2 mt-8">Performance Dates as push card info</h3>
	{#each perfsByMonthByProd as [prod, perfsByMonth]}
		<div class="mt-4 text-3xl font-bold">
			{prod.longTitle}
		</div>

		{#each perfsByMonth as [month, perfs]}
			<div>
				{month}
				<span>
					{perfs
						.map((x) => `${x.day}${slotToPushCardSymbol(x.slot)}`)
						.join(", ")}
				</span>
			</div>
		{/each}
	{/each}

	<h3 class="h2 mt-8">Performance Dates as website data</h3>
	{#each perfsByMonthByProd as [prod, perfsByMonth]}
		{@const perfMonthStrings = perfsByMonth.reduce((acc, [month, perfs]) => {
			acc.push(
				`${month} ${perfs.map((x) => `${x.day}${slotToWebCode(x.slot)}`).join(", ")}`,
			)
			return acc
		}, [] as string[])}

		<div class="mt-4 text-3xl font-bold">
			{prod.longTitle}
		</div>

		<button
			class="btn-p mb-2"
			onclick={() =>
				navigator.clipboard.writeText(
					perfMonthStrings.map((x) => `      ${x}`).join("\n") + "\n",
				)}>Copy</button
		>
		{#each perfMonthStrings as details}
			<div>
				{details}
			</div>
		{/each}
	{/each}
</div>
