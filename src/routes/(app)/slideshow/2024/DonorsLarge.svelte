<script lang="ts">
	import { fade } from "svelte/transition"
	import { onDestroy } from "svelte"
	import { browser } from "$app/environment"
	import { large } from "./donors"

	type Props = {
		durationMultiplier: number
		onEventDone: () => void
	}

	let { durationMultiplier, onEventDone: eventDone }: Props = $props()
	const INT = durationMultiplier * 500

	const sections = large
	const slides = sections.flatMap((s) =>
		s.names.map((t) => ({ title: s.title, content: t })),
	)

	let current = $state(0)

	function getNextIndex() {
		return (current + 1) % slides.length
	}

	let currentTimeout: number

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

	currentTimeout = browser ? window.setTimeout(nextOrDone, INT) : 0

	onDestroy(() => clearTimeout(currentTimeout))
</script>

{#each slides as slide, i}
	{#if i === current}
		<article class="absolute inset-0 flex flex-col">
			<header
				class="font-uber [font-size:5vw] text-center bg-green-700 text-white"
			>
				Annual Fund Donations
				<div class="bg-green-100 dark:bg-green-900 text-black dark:text-white">
					{slide.title}
				</div>
			</header>

			<div class="grow relative" transition:fade>
				<div
					class="absolute inset-0 flex justify-center items-center [font-size:5vw] font-bold text-center"
				>
					{slide.content}
				</div>
			</div>
		</article>
	{/if}
{/each}
