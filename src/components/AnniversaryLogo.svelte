<script lang="ts">
	import { asset } from "$app/paths"
	import { onMount } from "svelte"
	import {
		anniversaryLayout,
		anniversaryRays,
		rayFades,
		rayTreatments,
		type RayFade,
		type RayTreatment,
	} from "./anniversary-rays"
	import numberArtwork from "./anniversary-sparkles.json"

	let {
		treatment = "halo",
		fade = "closer",
	}: { treatment?: RayTreatment; fade?: RayFade } = $props()
	let logo: HTMLDivElement
	// Start CSS motion at first paint; JavaScript only manages power-saving pauses.
	let active = $state(true)
	const rays = $derived(anniversaryRays(treatment))
	const desktopRays = $derived(anniversaryRays(treatment, 0.8))
	const radius = $derived(rayTreatments[treatment].radius)
	const { x, y, originX, originY, width, height } = anniversaryLayout
	const { bounds, sparkles: numberSparkles, wordmarkSparkles } = numberArtwork
	const fadeId = $props.id()
	const tones = ["standard", "reversed"] as const

	onMount(() => {
		const motion = matchMedia("(prefers-reduced-motion: reduce)")
		let visible = false
		const update = () =>
			(active = visible && !motion.matches && !document.hidden)
		const observer = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting
			update()
		})
		observer.observe(logo)
		motion.addEventListener("change", update)
		document.addEventListener("visibilitychange", update)
		return () => {
			observer.disconnect()
			motion.removeEventListener("change", update)
			document.removeEventListener("visibilitychange", update)
		}
	})
</script>

<div class="relative" data-anniversary-logo={treatment}>
	<div
		bind:this={logo}
		aria-hidden="true"
		class="pointer-events-none absolute -z-10 aspect-square max-w-[clamp(36rem,75vw,48rem)] -translate-x-1/2 -translate-y-1/2 md:max-w-[clamp(64rem,110vw,96rem)]"
		style:width={`${((radius * 2) / width) * 100}%`}
		style:left={`${((originX - x) / width) * 100}%`}
		style:top={`${((originY - y) / height) * 100}%`}
		data-anniversary-burst
		data-motion={active ? "running" : "still"}
	>
		<svg
			viewBox={`${originX - radius} ${originY - radius} ${radius * 2} ${radius * 2}`}
			class="ray-layer absolute inset-0 h-full w-full"
			class:running={active}
			style:animation-duration={`${rayTreatments[treatment].period}s`}
		>
			<defs>
				<radialGradient
					id={fadeId}
					gradientUnits="userSpaceOnUse"
					cx={originX}
					cy={originY}
					r={radius}
				>
					<stop
						offset={rayFades[fade].clear}
						stop-color="#a7a9ac"
						stop-opacity="0"
					/>
					<stop
						offset={rayFades[fade].full}
						stop-color="#a7a9ac"
						stop-opacity="1"
					/>
				</radialGradient>
			</defs>
			<g
				fill={`url(#${fadeId})`}
				opacity={rayTreatments[treatment].opacity}
				data-rays
			>
				{#each rays as d, index (index)}
					<path d={desktopRays[index]} class="hidden md:block" />
					<path {d} class="md:hidden" />
				{/each}
			</g>
		</svg>
	</div>
	<!-- Keep animated highlights on small layers, separate from the static numeral. -->
	<div
		aria-hidden="true"
		class="pointer-events-none absolute z-10"
		style:left={`${bounds.left}%`}
		style:top={`${bounds.top}%`}
		style:width={`${bounds.width}%`}
		style:height={`${bounds.height}%`}
	>
		<img
			src={asset("/images/anniversary-60-number.svg")}
			alt=""
			class="block h-full w-full"
			data-anniversary-number
		/>
		<span
			class="sparkle central-glint absolute"
			class:running={active}
			data-number-sparkle="central"
			style:left={`${((63.0759 - 55) / 31) * 100}%`}
			style:top={`${((89.4968 - 84) / 25) * 100}%`}
			style:width={`${(13.6492 / 31) * 100}%`}
			style:height={`${(16.3212 / 25) * 100}%`}
		>
			<img
				src={asset("/images/anniversary-60-glint.svg")}
				alt=""
				class="block h-full w-full"
			/>
		</span>
		{#each numberSparkles as sparkle, index}
			{@const period = 43 + (((index + 1) * 7) % 17)}
			<span
				class="sparkle numeral-sparkle absolute"
				class:running={active}
				data-number-sparkle={index}
				style:animation-duration={`${period}s`}
				style:animation-delay={`${-(((index + 1) * 13.37 + 2.7) % period)}s`}
				style:left={`${sparkle.left}%`}
				style:top={`${sparkle.top}%`}
				style:width={`${sparkle.width}%`}
				style:height={`${sparkle.height}%`}
			>
				<svg viewBox={sparkle.viewBox} class="block h-full w-full">
					<path d={sparkle.d} transform={sparkle.transform} fill="#fff" />
				</svg>
			</span>
		{/each}
	</div>
	<svg
		role="img"
		aria-label="Post Playhouse — established 1967, celebrating 60 years"
		viewBox={`${x} ${y} ${width} ${height}`}
		{width}
		{height}
		class="h-auto w-full"
	>
		{#each tones as tone}
			{@const source = asset(`/images/anniversary-60-${tone}.svg`)}
			<g class={tone === "standard" ? "dark:hidden" : "hidden dark:block"}>
				{#each ["post", "playhouse", "established", "anniversary-years"] as layer}
					<use href={`${source}#${layer}`} />
				{/each}
			</g>
		{/each}
	</svg>
	{#each wordmarkSparkles as sparkle, index}
		<span
			aria-hidden="true"
			class="sparkle pointer-events-none absolute"
			class:running={active}
			data-sparkle={index}
			style:left={`${sparkle.left}%`}
			style:top={`${sparkle.top}%`}
			style:width={`${sparkle.width}%`}
			style:height={`${sparkle.height}%`}
		>
			<svg viewBox={sparkle.viewBox} class="block h-full w-full">
				<use
					href={`${asset("/images/anniversary-60-standard.svg")}#${sparkle.id}`}
				/>
			</svg>
		</span>
	{/each}
</div>

<style>
	.ray-layer {
		animation: turn 360s linear infinite paused;
		transform-origin: center;
	}
	.ray-layer.running {
		animation-play-state: running;
		will-change: transform;
	}
	/* Unequal periods and uneven pulse spacing avoid a metronomic alternation. */
	.sparkle {
		animation: twinkle 7.1s ease-in-out infinite both paused;
		transform-box: border-box;
		transform-origin: center;
	}
	.sparkle[data-sparkle="1"] {
		animation-duration: 9.7s;
		animation-delay: -3.1s;
	}
	.numeral-sparkle {
		opacity: 0;
		animation-name: glitter;
	}
	.central-glint {
		opacity: 1;
		animation-name: shimmer;
		animation-duration: 5.6s;
	}
	.sparkle.running {
		animation-play-state: running;
		will-change: transform, opacity;
	}
	@keyframes turn {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes twinkle {
		0%,
		51% {
			opacity: 0;
			transform: scale(0.65) rotate(-18deg);
		}
		6%,
		57% {
			opacity: 1;
			transform: scale(1.65) rotate(8deg);
		}
		12%,
		63%,
		100% {
			opacity: 0;
			transform: scale(0.85) rotate(30deg);
		}
	}
	@keyframes glitter {
		0% {
			opacity: 0;
			transform: scale(0.8) rotate(-18deg);
		}
		1% {
			opacity: 1;
			transform: scale(1.65) rotate(8deg);
		}
		2.3%,
		100% {
			opacity: 0;
			transform: scale(0.9) rotate(30deg);
		}
	}
	@keyframes shimmer {
		0%,
		100% {
			opacity: 0.45;
			transform: scale(0.88) rotate(-12deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.12) rotate(12deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ray-layer,
		.sparkle {
			animation: none;
		}
		.ray-layer.running,
		.sparkle.running {
			will-change: auto;
		}
	}
</style>
