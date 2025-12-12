<script lang="ts">
	import { fade } from "svelte/transition"
	import { onDestroy } from "svelte"
	import { browser } from "$app/environment"
	import { special } from "./donors"

	type Props = {
		durationMultiplier: number
		onEventDone: () => void
	}

	let { durationMultiplier, onEventDone: eventDone }: Props = $props()
	const INT = $derived(durationMultiplier * 500)

	const sections = special
	const slides = sections.flatMap((s) =>
		s.names.map((t) => ({ title: s.title, content: t })),
	)

	let current = $state(0)

	function getNextIndex() {
		return (current + 1) % slides.length
	}

	let currentTimeout = $derived(
		browser ? window.setTimeout(nextOrDone, INT) : 0,
	)

	function nextOrDone() {
		if (!browser) return
		const nextInt = getNextIndex()
		if (nextInt > 0) {
			current = nextInt
			currentTimeout = window.setTimeout(nextOrDone, INT)
		} else {
			eventDone()
		}
	}

	onDestroy(() => clearTimeout(currentTimeout))
</script>

{#each slides as slide, i}
	{#if i === current}
		<article class="absolute inset-0 flex flex-col">
			<header class="font-uber bg-green-700 text-center text-[5vw] text-white">
				Special Campaign Donations

				<p
					class="bg-green-300 p-4 text-left font-sans text-[3vw] text-black dark:bg-green-950 dark:text-white"
				>
					Special thanks to to the following donors for their special support
					this year to help us enhance our technological capabilities of
					lighting, sound, and visual effects.
				</p>
				<div class="bg-green-100 text-black dark:bg-green-900 dark:text-white">
					{slide.title}
				</div>
			</header>

			<div class="relative grow" transition:fade>
				<div
					class="absolute inset-0 flex items-center justify-center text-center text-[5vw] font-bold"
				>
					{slide.content}
				</div>
			</div>
		</article>
	{/if}
{/each}
