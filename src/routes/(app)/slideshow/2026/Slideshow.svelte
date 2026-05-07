<script lang="ts">
	import { fade } from "svelte/transition"
	import DonorsScroll from "./DonorsScroll.svelte"
	import DonorsSolo from "./DonorsSolo.svelte"
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

	const slideSets = $derived<
		Array<{
			id: string
			title: string
			description?: string
			sections: (typeof slideData)["large"]
			durationMultiplier: ReturnType<typeof createPositiveIntStore>
			Component: typeof DonorsSolo | typeof DonorsScroll
		}>
	>(
		[
			{
				id: "Special Donors",
				title: "Special Campaign Donations",
				description:
					"Special thanks to to the following donors for their special support this year to help us expand our reach through capital campaign support to enhance theatrical and company housing infrastructure.",
				sections: slideData.special,
				durationMultiplier: createPositiveIntStore(8, `${year} sd`),
				Component: DonorsSolo,
			},
			{
				id: "Large Donors",
				title: "Annual Fund Donations",
				sections: slideData.large,
				durationMultiplier: createPositiveIntStore(8, `${year} ld`),
				Component: DonorsSolo,
			},
			{
				id: "Small Donors",
				title: "Annual Fund Donations",
				sections: slideData.small,
				durationMultiplier: createPositiveIntStore(10, `${year} rd`),
				Component: DonorsScroll,
			},
		].filter(({ sections }) => sections.length > 0),
	)

	let inc = $state(0)

	function nextShow() {
		inc += 1

		const isSixthFullRun = inc % (slideSets.length * 6) === 0

		if (isSixthFullRun) {
			invalidateAll() // refetch the google sheet data
			refreshIfAppVersionOutdated()
		}
	}

	let resetCount = $state(0)

	let currentSlideSet = $derived(slideSets[inc % slideSets.length])

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
				currentSlideSet.durationMultiplier.increment()
				resetCount = resetCount + 1
				speedInfoVisible = true
				break
			case "ArrowUp":
				event.preventDefault()
				currentSlideSet.durationMultiplier.decrement()
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
					{#each slideSets as { id }}
						<li>{id}</li>
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

		{#each slideSets as { id: section, sections: subsections }}
			<div class="mt-8 mb-4 border-b-2 border-black text-xl dark:border-white">
				<strong>
					{section.toUpperCase()}
				</strong>
			</div>
			{#each subsections as { title, names }}
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
				<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
					<currentSlideSet.Component
						setTitle={currentSlideSet.title}
						description={currentSlideSet.description}
						durationMultiplier={currentSlideSet.durationMultiplier.value}
						onEventDone={() => nextShow()}
						sections={currentSlideSet.sections}
					/>
				</div>
			{:else}
				<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
					<currentSlideSet.Component
						setTitle={currentSlideSet.title}
						description={currentSlideSet.description}
						durationMultiplier={currentSlideSet.durationMultiplier.value}
						onEventDone={() => nextShow()}
						sections={currentSlideSet.sections}
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
			Set: {currentSlideSet.id} <br />Speed: {20 -
				(currentSlideSet.durationMultiplier.value - 1)}
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
	@reference "../../../../app.css";

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
