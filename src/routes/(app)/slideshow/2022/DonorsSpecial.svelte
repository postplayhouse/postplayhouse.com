<script lang="ts">
	import { fade } from "svelte/transition"
	import { fast } from "./helpers"

	const INT = fast ? 500 : 5000

	type Props = {
		onEventDone: () => void
	}

	let { onEventDone: eventDone }: Props = $props()

	const sections = [
		{
			title: "$25,000+",
			names: [
				"21st Century Equipment",
				"Dawes County Travel Board",
				"Dillon Foundation",
				"Security First Bank",
				"The Sherwood Foundation",
				"Susan Sehnert Stuart, in Honor of Walt and Jean Sehnert",
				"WESTCO",
			],
		},
		{
			title: "$10,000+",
			names: [
				"BNSF Railway Foundation",
				"James & Jacqueline Irwin",
				"Peter Kiewit Foundation",
				"Joan Laudeman",
				"James Stuart, III Foundation, Jim and Barbara Stuart",
			],
		},
		{
			title: "$5,000+",
			names: [
				"H & R Block of Chadron",
				"Tim Hindman Family",
				"Jim and Jeanne Walter ",
				"Linda and Jon Steven Wiley",
			],
		},
		{
			title: "$1,000+",
			names: [
				"Julia Buchheit",
				"Karleen & Merlyn Gramberg",
				"Herren Bros, True Value",
				"Kelley Bean Company",
				"Kathryn and Dennis King",
				"Mobius Communications Company",
				"Jeanine Mohr",
				"Marge Rotherham",
				"Richard Sellman",
				"Janelle Visser",
				"Anonymous (2)",
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
				Special Campaign Donations

				<p
					class="bg-green-300 p-4 text-left font-sans text-[3vw] text-black dark:bg-green-950 dark:text-white"
				>
					Post Playhouse is especially grateful for the donors who have
					supported us during the pandemic years for special programs which
					include capital projects, endowment, and covid relief funding. These
					“Special Campaign” gifts provide a financial foundation that allows
					for a bright future for the Post Playhouse.
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
