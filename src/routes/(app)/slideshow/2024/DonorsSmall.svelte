<script lang="ts">
	import { crossfade } from "svelte/transition"
	import { linear } from "svelte/easing"
	import { onDestroy } from "svelte"
	import { browser } from "$app/environment"
	import { small } from "./donors"

	type Props = {
		durationMultiplier: number
		onEventDone: () => void
	}

	let { durationMultiplier, onEventDone: eventDone }: Props = $props()

	const sections = small

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
				class="bg-green-700 text-center font-uber text-white [font-size:5vw]"
			>
				Annual Fund Donations
				<div class="bg-green-100 text-black dark:bg-green-900 dark:text-white">
					{slide.title}
				</div>
			</header>

			<div class="relative grow">
				<div
					class="absolute inset-0 overflow-hidden text-center font-bold [font-size:5vw]"
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
