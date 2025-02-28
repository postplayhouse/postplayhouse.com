<script lang="ts">
	import { fade } from "svelte/transition"
	import Donors1000 from "./Donors1000.svelte"
	import Donors1 from "./Donors1.svelte"
	import { onMount } from "svelte"
	import {
		initLocalAppVersion,
		refreshIfAppVersionOutdated,
	} from "$helpers/app-version"
	import { createIntStore } from "$helpers/stores.svelte"

	onMount(initLocalAppVersion)

	function createPositiveIntStore(initialValue = 1, localStorageName?: string) {
		return createIntStore(initialValue, {
			localStorageName,
			min: 1,
		})
	}

	const showsAndTimers = [
		[Donors1000, createPositiveIntStore(8, "2023 ld"), "Large Donations"],
		[Donors1, createPositiveIntStore(10, "2023 rd"), "Regular Donations"],
	] as const

	const shows = showsAndTimers.map(([show]) => show)
	const timers = showsAndTimers.map(([_, timer]) => timer)
	const showNames = showsAndTimers.map(([_, __, name]) => name)

	let inc = $state(0)

	function nextShow() {
		inc += 1

		const isSixthFullRun = inc % (shows.length * 6) === 0

		if (isSixthFullRun) {
			refreshIfAppVersionOutdated()
		}
	}

	let resetCount = $state(0)

	let currentDurationMultiplier = $derived(
		timers[inc % timers.length] as (typeof timers)[number],
	)

	function onKeyDown(event: KeyboardEvent) {
		if (event.repeat) return

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault()
				currentDurationMultiplier.increment()
				resetCount = resetCount + 1
				visible = true
				break
			case "ArrowUp":
				event.preventDefault()
				currentDurationMultiplier.decrement()
				resetCount = resetCount + 1
				visible = true
				break
			case "ArrowLeft":
				event.preventDefault()
				if (inc === 0) {
					resetCount = resetCount + 1
				} else {
					inc -= 1
				}
				break
			case "ArrowRight":
				event.preventDefault()
				inc += 1
				break
		}
	}

	let visible = $state(true)

	$effect(() => {
		visible = visible && false
	})
</script>

<svelte:window onkeydown={onKeyDown} />

{#key resetCount}
	<div class="fixed inset-0 dark:bg-black dark:text-white">
		{#if inc % 2 === 0}
			{@const ShowComponent = shows[inc % shows.length]}
			<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
				<ShowComponent
					durationMultiplier={currentDurationMultiplier.value}
					onEventDone={() => nextShow()}
				/>
			</div>
		{:else}
			{@const ShowComponent = shows[inc % shows.length]}
			<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
				<ShowComponent
					durationMultiplier={currentDurationMultiplier.value}
					onEventDone={() => nextShow()}
				/>
			</div>
		{/if}
	</div>
	{#if visible}
		<div
			out:fade={{ duration: 1000, delay: 1000 }}
			class="fixed inset-0 flex items-center justify-center"
		>
			<span
				class="rounded-lg bg-black/50 px-2 py-1 text-[6vw] font-bold text-white dark:bg-white/50 dark:text-black"
			>
				{showNames[inc % showNames.length]} Speed: {20 -
					(currentDurationMultiplier.value - 1)}
			</span>
		</div>
	{/if}
{/key}
