<script lang="ts">
	import { fade } from "svelte/transition"
	import DonorsLarge from "./DonorsLarge.svelte"
	import DonorsSmall from "./DonorsSmall.svelte"
	import DonorsSpecial from "./DonorsSpecial.svelte"
	import { onMount } from "svelte"
	import {
		initLocalAppVersion,
		refreshIfAppVersionOutdated,
	} from "$helpers/app-version"
	import { createIntStore } from "$helpers/stores.svelte"
	import { large, small, special } from "./donors"

	onMount(initLocalAppVersion)

	function createPositiveIntStore(initialValue = 1, localStorageName?: string) {
		return createIntStore(initialValue, {
			localStorageName,
			min: 1,
		})
	}

	const showsAndTimers = [
		[DonorsSpecial, createPositiveIntStore(8, "2024 sd"), "Special Donations"],
		[DonorsLarge, createPositiveIntStore(8, "2024 ld"), "Large Donations"],
		[DonorsSmall, createPositiveIntStore(10, "2024 rd"), "Regular Donations"],
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

	let showInfo = $state(false)

	const info = { special, large, small }

	function onKeyDown(event: KeyboardEvent) {
		if (event.repeat) return

		switch (event.key) {
			case "i":
				event.preventDefault()
				showInfo = !showInfo
				break
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

{#if showInfo}
	{#each Object.entries(info) as [section, subsection]}
		<div class="mt-8 text-xl">
			<div>
				<strong>
					{section.toUpperCase()}
				</strong>
			</div>
		</div>
		{#each subsection as { title, names }}
			<div class="mb-6">
				<div>
					<strong>
						{title}
					</strong>
				</div>

				{#each names as name}
					<div>
						{name}
					</div>
				{/each}
			</div>
		{/each}
	{/each}
{:else}
	{#key resetCount}
		<div class="fixed inset-0 dark:bg-black dark:text-white">
			{#if inc % 2 === 0}
				<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
					<svelte:component
						this={shows[inc % shows.length]}
						durationMultiplier={currentDurationMultiplier.value}
						onEventDone={() => nextShow()}
					/>
				</div>
			{:else}
				<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
					<svelte:component
						this={shows[inc % shows.length]}
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
{/if}
