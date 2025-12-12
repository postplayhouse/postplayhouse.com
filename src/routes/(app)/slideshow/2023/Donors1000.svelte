<script lang="ts">
	import { fade } from "svelte/transition"
	import { onDestroy } from "svelte"
	import { browser } from "$app/environment"

	type Props = {
		durationMultiplier: number
		onEventDone: () => void
	}

	let { durationMultiplier, onEventDone: eventDone }: Props = $props()
	let INT = $derived(durationMultiplier * 500)

	const sections = [
		{
			title: "$10,000+",
			names: [
				"Casey Peterson",
				"Chadron State College",
				"Security First Bank",
				"Anonymous (1)",
			],
		},
		{
			title: "$6,000+",
			names: [
				"Footprints, Your Birkenstock Store",
				"Todd A. Gaswick at TAG Financial Solutions ",
				"Mobius Communications",
				"Susan Sehnert Stuart",
				"WESTCO",
			],
		},
		{
			title: "$5,000+",
			names: [
				"Bill and Virginia Coffee Family Foundation",
				"Nebraska Arts Council",
			],
		},
		{
			title: "$2,500+",
			names: ["Darold Newblom Foundation", "Linda and Jon Steven Wiley"],
		},
		{
			title: "$1,000+",
			names: [
				"H&R Block of Chadron",
				"Jack Isaacs",
				"Martin Drug & Mercantile",
				"Jeanine Mohr",
				"Phillips F & T Inc.",
				"Annie and Richard Sellman",
				"Cathy Soester",
				"Janelle Visser",
				"Walmart Foundation",
				"Bertram and Patricia Witham Foundation",
			],
		},
	]
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
				Annual Fund Donations
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
