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
	import type { large as l, small as sm, special as sp } from "./donors"
	import { invalidateAll } from "$app/navigation"

	type Props = {
		slideData: {
			large: typeof l
			small: typeof sm
			special: typeof sp
		}
	}

	let { slideData }: Props = $props()

	const year = 2025

	onMount(initLocalAppVersion)

	function createPositiveIntStore(initialValue = 1, localStorageName?: string) {
		return createIntStore(initialValue, {
			localStorageName,
			min: 1,
		})
	}

	const showsAndTimers = $derived(
		(
			[
				[
					DonorsSpecial,
					createPositiveIntStore(8, `${year} sd`),
					"Special Donations",
					slideData.special,
				],
				[
					DonorsLarge,
					createPositiveIntStore(8, `${year} ld`),
					"Large Donations",
					slideData.large,
				],
				[
					DonorsSmall,
					createPositiveIntStore(10, `${year} rd`),
					"Regular Donations",
					slideData.small,
				],
			] as const
		).filter(([_, __, ___, sections]) => sections.length > 0),
	)

	const shows = $derived(showsAndTimers.map(([show]) => show))
	const timers = $derived(showsAndTimers.map(([_, timer]) => timer))
	const showNames = $derived(showsAndTimers.map(([_, __, name]) => name))
	const donorSections = $derived(
		showsAndTimers.map(([_, __, ___, sections]) => sections),
	)

	let inc = $state(0)

	function nextShow() {
		inc += 1

		const isSixthFullRun = inc % (shows.length * 6) === 0

		if (isSixthFullRun) {
			invalidateAll() // refetch the google sheet data
			refreshIfAppVersionOutdated()
		}
	}

	let resetCount = $state(0)

	let currentDurationMultiplier = $derived(
		timers[inc % timers.length] as (typeof timers)[number],
	)

	let showInfo = $state(false)

	function onKeyDown(event: KeyboardEvent) {
		if (event.repeat) return

		switch (event.key) {
			case "/":
			case "?":
				event.preventDefault()
				showInfo = !showInfo
				break
			case "ArrowDown":
				event.preventDefault()
				currentDurationMultiplier.increment()
				resetCount = resetCount + 1
				speedInfoVisible = true
				break
			case "ArrowUp":
				event.preventDefault()
				currentDurationMultiplier.decrement()
				resetCount = resetCount + 1
				speedInfoVisible = true
				break
			case "ArrowLeft":
				event.preventDefault()
				if (inc === 0) {
					resetCount = resetCount + 1
				} else {
					inc -= 1
				}
				speedInfoVisible = true
				break
			case "ArrowRight":
				event.preventDefault()
				inc += 1
				speedInfoVisible = true
				break
			default:
				speedInfoVisible = true
		}
	}

	let speedInfoVisible = $state(true)

	$effect(() => {
		speedInfoVisible = speedInfoVisible && false
	})
</script>

<svelte:window onkeydown={onKeyDown} />

{#if showInfo}
	<div class="p-8 text-xl">
		<div class="max-w-lg space-y-4">
			<p>
				This is the information screen about the slideshow. Press the <code
					>?</code
				> key to toggle this screen open and closed.
			</p>
			<p>The slideshow is comprised of multiple slide sets:</p>
			<strong>
				<ul>
					{#each showNames as name}
						<li>{name}</li>
					{/each}
				</ul>
			</strong>
			<p>
				Getting the speed right for each show is not an exact science, so you
				can adjust the speed of the show by pressing the arrow keys. Your
				changes are automatically saved to this device.
			</p>
		</div>

		<!-- Start of the keyboard shortcuts info pane -->
		<div class="mt-8 text-xl">
			<div>
				<strong>Keyboard Shortcuts</strong>
				<p class="text-sm">
					If you are on a mobile device, you can only show/hide this screen by
					tapping the ? in the bottom right corner. Every other action requires
					a computer with a keyboard.
				</p>
			</div>
			<div class="mt-4">
				<code>?</code>: Show/hide this information screen
			</div>
			<div class="mt-4">
				<code>Arrow Down</code>: Speed up the current slide set
			</div>
			<div class="mt-4">
				<code>Arrow Up</code>: Slow down the current slide set
			</div>
			<div class="mt-4">
				<code>Arrow Left</code>: Go to the previous slide set
			</div>
			<div class="mt-4">
				<code>Arrow Right</code>: Go to the next slide set
			</div>
		</div>

		<div class="my-12 max-w-lg">
			<p>
				See below to check the information in the slideshow without having to
				watch the whole thing. Email or message Don in Basecamp if you want to
				make changes.
			</p>
		</div>

		<hr class="border-8" />

		{#each showsAndTimers as [_, __, section, subsection]}
			<div class="mt-8 mb-4 border-b-2 border-black text-xl dark:border-white">
				<strong>
					{section.toUpperCase()}
				</strong>
			</div>
			{#each subsection as { title, names }}
				<div class="mb-6">
					<div>
						<button
							class="font-bold"
							onclick={(el) =>
								navigator.clipboard.writeText(el.currentTarget.innerHTML)}
						>
							{title}
						</button>
					</div>

					{#each names as name}
						<div>
							{name}
						</div>
					{/each}
				</div>
			{/each}
		{/each}
	</div>
{:else}
	{#key resetCount}
		<div class="fixed inset-0 dark:bg-black dark:text-white">
			{#if inc % 2 === 0}
				{@const ShowComponent = shows[inc % shows.length]}
				{@const sections = donorSections[inc % shows.length]}
				<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
					<ShowComponent
						durationMultiplier={currentDurationMultiplier.value}
						onEventDone={() => nextShow()}
						{sections}
					/>
				</div>
			{:else}
				{@const ShowComponent = shows[inc % shows.length]}
				{@const sections = donorSections[inc % shows.length]}
				<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
					<ShowComponent
						durationMultiplier={currentDurationMultiplier.value}
						onEventDone={() => nextShow()}
						{sections}
					/>
				</div>
			{/if}
		</div>
	{/key}
{/if}
{#if speedInfoVisible}
	<div
		out:fade={{ duration: 1000, delay: 1500 }}
		class="fixed inset-8 flex flex-col items-center justify-center"
	>
		<div
			class="w-full rounded-lg bg-black/80 px-2 py-1 text-[6vw] font-bold text-white dark:bg-white/80 dark:text-black"
		>
			Set: {showNames[inc % showNames.length]} <br />Speed: {20 -
				(currentDurationMultiplier.value - 1)}
		</div>
		{#if !showInfo}
			<div
				class="mt-3 rounded-lg bg-black/80 p-8 text-3xl text-white dark:bg-white/80 dark:text-black"
			>
				Press <code>?</code> key for help.
			</div>
		{/if}
	</div>
{/if}

<div class="touch:block z-10 md:hidden">
	<div class="fixed right-4 bottom-4">
		<button
			data-active={showInfo || undefined}
			onclick={() => {
				showInfo = !showInfo
			}}
			class="flex size-8 cursor-pointer items-center justify-center rounded-full border border-gray-900 bg-gray-200 text-lg text-black shadow-md hover:bg-gray-300 data-active:invert"
		>
			?
		</button>
	</div>
</div>

<style lang="postcss">
	code {
		@apply rounded border border-gray-800 bg-gray-100 px-2 py-1 font-mono text-[smaller] text-gray-800;
	}

	/* Likely touch device */
	@media (hover: none) and (pointer: coarse) {
		.touch\:block {
			display: block;
		}
	}
</style>
