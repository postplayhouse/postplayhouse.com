<script lang="ts">
	import { fade } from "svelte/transition"
	import { fast } from "./helpers"

	const INT = fast ? 500 : 5000

	type Props = {
		onEventDone: () => void
	}

	let { onEventDone: eventDone }: Props = $props()

	const sections = [
		{ title: "$200,000+", names: ["Shuttered Venue Operators Grant"] },
		{
			title: "$10,000+",
			names: ["Chadron State College", "Nebraska Arts Council"],
		},
		{
			title: "$5,000+",
			names: [
				"Big Bat's, LLC",
				"Caterpillar Foundation",
				"Footprints",
				"Lee & Elizabeth Fritzler",
				"Todd Gaswick",
				"Tim Hindman Family",
				"Security First Bank",
				"Susan Sehnert Stuart, in Honor of Walt and Jean Sehnert",
				"Linda and Jon Steven Wiley",
				"Red Beard Garage & Towing",
			],
		},
		{
			title: "$2,500+",
			names: [
				"Darold Newblom Foundation",
				"Walmart Foundation",
				"Janet E Williams",
				"Bertram and Patricia Witham Foundation",
			],
		},
		{
			title: "$1,000+",
			names: [
				"David Bauerkemper",
				"Steve Cleveland",
				"Helen Kent",
				"Martin Drug & Mercantile",
				"Janelle Visser",
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

	function nextOrDone() {
		const nextInt = getNextIndex()
		if (nextInt > 0) {
			current = nextInt
			setTimeout(nextOrDone, INT)
		} else {
			eventDone()
		}
	}

	setTimeout(nextOrDone, INT)
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
