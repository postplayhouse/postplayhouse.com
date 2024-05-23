<script lang="ts">
	import { crossfade } from "svelte/transition"
	import { linear } from "svelte/easing"
	import { onDestroy } from "svelte"
	import { browser } from "$app/environment"

	type Props = {
		durationMultiplier: number
		onEventDone: () => void
	}

	let { durationMultiplier, onEventDone: eventDone }: Props = $props()

	const sections = [
		{
			title: "$500+",
			names: [
				"David and Diana Bauerkemper",
				"James and Kathy Bowers",
				"Blake Hansen",
				"Hardrock Blasting",
				"JAV Enterprises LLC",
				"Mobius Communications",
				"Nebraska Bank",
				"Dena Paris",
				"Platte Valley Bank",
				"Troy Unzicker",
				"Anonymous (1)",
			],
		},
		{
			title: "$250+",
			names: [
				"Benguin Propane",
				"Gary and Dixie Blundell",
				"Buchheit Precision",
				"Delsing Farms",
				"John and Nancy Erickson",
				"Farmers Coop Elevator Company",
				"Merlyn* and Karleen Gramberg",
				"Hardrock Blasting",
				"Hemingford Community Federal Credit Union",
				"Dennis and Kathie King",
				"Steve and Kathy Klaes",
				"Glen Kotschwar",
				"Curt and Mary Lou Lecher",
				"Patrick McMahon",
				"Kathy Orloski",
				"Dave and Ali Redden",
				"Joan and Clark Scarboro",
				"Tom Schleff",
				"Table Top Meats Inc.",
				"Terrance Terrell",
			],
		},
		{
			title: "$100+",
			names: [
				"Von Bartlett",
				"David Batchelor",
				"Mark Berge",
				"Jo Buccheit",
				"Doris Burton",
				"Cheryl and Jerry Cassiday",
				"Chadron Lawn Care",
				"Crawford Livestock Market",
				"Paul Cutler",
				"Robert Delsing",
				"Donna Engle",
				"Farmers Coop Elevator Company",
				"Guy Fish",
				"Florence Foldenauer",
				"Tim and Kari Gaswick",
				"Darold German",
				"Bev Hanks",
				"Jason Hawk",
				"Alex and Brittany Helmbrecht",
				"Ann Hencey",
				"Rick and Misty Hickstein",
				"Cindi Jacobsen-Brinton",
				"JAV Enterpirses LLC",
				"Joni and Donald Jespersen",
				"Randy Kane",
				"Barb Kendle",
				"Greta Kickland",
				"Danielle and Clint Lecher",
				"Mary Lou Marshall",
				"David and Jean Mattson",
				"TJ Moore",
				"Music and Dramatic Club of Gordon",
				"Doug and Keri Ohlson",
				"Johannah Oleksy",
				"Jill PaoPao",
				"Bradley Peterson",
				"Glen Price",
				"Kim Reichert",
				"Joyce Ruse",
				"Sue Rusie",
				"Nancy Sayer",
				"Sandra Scofield",
				"Wally Seiler",
				"Joyce Sekutera",
				"Douglas Shaver",
				"Nathan Smith",
				"Dana Sorensen",
				"Ted and Dana Tewahade",
				"Linda Thayer",
				"Russ and Susan Trinter",
				"Ted Vastine",
				"Robert and Jane Wahlstrom",
				"Brad and Sue Williams",
				"Dee Wood",
				"Les Wright",
			],
		},
	]

	const slides = $state(sections.map((x) => ({ ...x, position: "bottom" })))

	let current = $state(0)

	function getNextIndex() {
		return (current + 1) % sections.length
	}

	let currentTimeout: number

	function nextOrDone() {
		if (!browser) return

		const nextIndex = getNextIndex()
		if (nextIndex > 0) {
			const oldIndex = current
			current = nextIndex
			currentTimeout = window.setTimeout(() => {
				slides[nextIndex]!.position = "top"
				slides[oldIndex]!.position = "bottom"
			}, 10)
		} else {
			eventDone()
		}
	}

	currentTimeout = browser
		? window.setTimeout(() => (slides[current]!.position = "top"), 10)
		: 0

	onDestroy(() => clearTimeout(currentTimeout))

	const [send, receive] = crossfade({
		duration: (distance) => {
			return distance * durationMultiplier
		},
		easing: linear,

		fallback() {
			return {
				duration: 0,
				easing: linear,
			}
		},
	})
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

			<div class="grow relative">
				<div
					class="absolute inset-0 [font-size:5vw] font-bold text-center overflow-hidden"
				>
					<div class="absolute left-0 right-0 [bottom:100vh]">
						{#if slide.position === "top"}
							<div
								in:receive="{{ key: slide.title }}"
								out:send="{{ key: slide.title }}"
								onintroend="{nextOrDone}"
							>
								{#each slide.names as name}
									<div>{name}</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="absolute left-0 right-0 [top:80vh]">
						{#if slide.position === "bottom"}
							<div
								in:receive="{{ key: slide.title }}"
								out:send="{{ key: slide.title }}"
							>
								{#each slide.names as name}
									<div>{name}</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</article>
	{/if}
{/each}
