<script lang="ts">
	import { crossfade } from "svelte/transition"

	import { linear } from "svelte/easing"
	import { createEventDispatcher, onDestroy } from "svelte"
	import { browser } from "$app/environment"

	export let durationMultiplier: number

	const dispatch = createEventDispatcher()

	function eventDone() {
		dispatch("done")
	}

	const sections = [
		{
			title: "$500+",
			names: [
				"David and Diana Bauerkemper",
				"Big Bat's, LLC",
				"Jim and Amy Gardner",
				"Blake Hansen",
				"Hardrock Blasting",
				"JAV Enterprises LLC",
				"Nebraska Bank",
				"Platte Valley Bank",
				"Troy Unzicker",
			],
		},
		{
			title: "$250+",
			names: [
				"Arrow Building Center",
				"Buchheit Precision",
				"Julia Buchheit",
				"Delsing Farms",
				"John and Nancy Erickson",
				"Farmers Coop Elevator Company",
				"Dennis and Kathy King",
				"Steve and Kathy Klaes",
				"Patrick McMahon",
				"April Neubauer",
				"Table Top Meats Inc.",
				"Terrance Terrell",
			],
		},
		{
			title: "$100+",
			names: [
				"David And Laura Batchelor",
				"Mark Berge",
				"Adde & Eli Bryner",
				"Doris Burton",
				"Shay Carmichael",
				"Susan Carrier",
				"Jerry Cassiday",
				"Robert Delsing",
				"Donna Engel",
				"Cheryl Ginkens",
				"Beverly Hanks",
				"Herren Bros. True Value",
				"Russell Hohman",
				"Randy Kane",
				"David & Jean Mattson",
				"Carol Metzger",
				"Kathleen Meyer",
				"TJ and Mary Jo Moore",
				"Music and Dramatic Club of Gordon",
				"Kathleen Orloski",
				"Pests Go LLC",
				"Bradley Petersen",
				"Lynn Poppen",
				"Glenn Price",
				"Arden Rosenberger",
				"Ron Scharf",
				"Tom Schleff",
				"Wally Seiler",
				"Marlin Sekutera",
				"Douglas Shaver",
				"Dana Sorensen",
				"Bob Unzicker",
				"Ted Vastine",
				"Dee Wood",
			],
		},
		{
			title: "$1–99",
			names: [
				"Janet Allen",
				"Vince M Bartlett",
				"S S Batty",
				"Dean Bohn",
				"Rose Burrows",
				"Michael Cameron",
				"Gwenda Canet",
				"Jerry Cassiday",
				"Titus Coop",
				"Lynda Denton",
				"Trayce Dinkel",
				"Ellen Dornemann",
				"Jill Ellis",
				"JoAnn Emerson",
				"Dara Edwards",
				"Michaela Gasseling",
				"Mike Gering",
				"Leslie Green",
				"Marilyn Halse",
				"Barbara J. Hardy",
				"Jason Hawk",
				"Conan Heelan",
				"Bruce Hitchcock",
				"Joe Jacquot",
				"Terry Jones",
				"Lynette F. Kautz",
				"Cheri Koenig",
				"Linda Maurer",
				"Jenn Maurer",
				"Michael Mittlestadt",
				"Jennifer Nixon",
				"North Side SWPBIS",
				"Claudia Olafson",
				"Jarrett Owens",
				"Jill Paopao",
				"Tony Perlinski",
				"Tabi Prochazka",
				"Cindy Randall",
				"John Randall",
				"Cheri Reese",
				"Glenn Reynolds",
				"Ted Rudberg",
				"Bernice L. Russell",
				"Sheila Schmeits",
				"Donna Schoenbeck",
				"Joel Schwartzkopf",
				"Scottsbluff Star-Herald",
				"Wally Seiler",
				"Lynn Sherry",
				"Eleanor Shimek",
				"Michael Solum",
				"Craig & Teresa Srajer",
				"Ann Stephens",
				"Denise Stone",
				"Peter and Janice Swedberg",
				"John Trapp",
				"Louise Vance",
				"Michael Wellnitz",
				"Edward Williams",
				"David Yanoski",
				"Lora Young",
				"Michael Zahn",
				"Robert Zanger",
				"Anonymous (3)",
			],
		},
	]

	const slides = sections.map((x) => ({ ...x, position: "bottom" }))

	let current = 0

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
				<div class="bg-green-100 text-black">
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
								on:introend="{nextOrDone}"
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
