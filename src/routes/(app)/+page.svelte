<script lang="ts">
	import Mailer from "$components/Mailer.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import Openings from "$components/Openings/Openings.svelte"
	import SponsorPlate from "$components/SponsorPlate.svelte"
	import * as site from "$data/site"
	import seasonAnnouncement from "./2027-season-announcement.jpg?enhanced"

	import DonateBtn from "$components/DonateBtn.svelte"
	import { isToday } from "date-fns"
	import givingTuesday from "../../images/seasons/2027/giving-tuesday.jpg?enhanced"
	import givingTuesdayWordmark from "../../images/seasons/2027/giving-tuesday-wordmark-white.png?enhanced"
	import { dev } from "$app/environment"
	import { asset } from "$app/paths"
	import {
		anniversaryLayout as logo,
		anniversaryRays,
		rayTreatments,
	} from "$components/anniversary-rays"

	// Giving Tuesday ray settings. Reach is in the logo's own units (it is 108 wide).
	const rayStyle = {
		treatment: "wide",
		thickness: 0.85,
		brightness: 0.35,
		reach: 80,
	} as const
	const rays = anniversaryRays(rayStyle.treatment, rayStyle.thickness)
	const rayRadius = rayTreatments[rayStyle.treatment].radius
	const rayReach = rayStyle.reach

	let { data } = $props()

	const { productions, season } = $derived(data)

	let showMailingList = $state(false)

	function toggleMailingList() {
		showMailingList = !showMailingList
	}
</script>

<svelte:head>
	<title>Post Playhouse</title>

	<meta name="description" content={site.description} />
	<link rel="canonical" href="https://postplayhouse.com" />

	<!-- Facebook Meta Tags -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Post Playhouse" />
	<meta property="og:description" content={site.description} />
</svelte:head>

{#if isToday(dev ? new Date() : new Date("2026-12-01T00:00:00.000"))}
	<div class="mx-auto mb-16 block max-w-2xl p-6">
		<p class="mb-6 text-xl font-bold">It’s #GivingTuesday2026!</p>
		<!-- Photo and logos stay separate layers so each can be swapped or moved. -->
		<div
			class="@container relative aspect-[940/788] -rotate-1 overflow-hidden shadow-md"
		>
			<enhanced:img
				class="absolute inset-0 h-full w-full object-cover"
				src={givingTuesday}
				alt="A Post performer in a pink sequined costume and feathered headdress, laughing on stage."
			></enhanced:img>
			<!-- Darkens the corner behind the white logos so they stay legible. -->
			<div
				class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(0_0_0/0.75),rgb(0_0_0/0.35)_30%,transparent_55%)]"
			></div>
			<!-- Positions match Brooke's Option 5 draft. -->
			<div
				class="absolute top-[7.3%] left-[4.3%] flex w-[48%] flex-col gap-[6.5cqw]"
			>
				<enhanced:img
					class="h-auto w-full"
					src={givingTuesdayWordmark}
					alt="GivingTuesday"
				></enhanced:img>
				<div class="relative ml-[4.5%] w-[55%]">
					<!-- The header's ray shapes, static and fading outward so they
					     show near the logo but stop short of her face. -->
					<svg
						aria-hidden="true"
						class="absolute -translate-x-1/2 -translate-y-1/2"
						style:left={`${((logo.originX - logo.x) / logo.width) * 100}%`}
						style:top={`${((logo.originY - logo.y) / logo.height) * 100}%`}
						style:width={`${((rayReach * 2) / logo.width) * 100}%`}
						viewBox={`${logo.originX - rayRadius} ${logo.originY - rayRadius} ${rayRadius * 2} ${rayRadius * 2}`}
					>
						<defs>
							<radialGradient
								id="giving-tuesday-rays"
								gradientUnits="userSpaceOnUse"
								cx={logo.originX}
								cy={logo.originY}
								r={rayRadius}
							>
								<!-- Clear behind the lettering, brightest just past it. -->
								<stop offset="0.3" stop-color="#fff" stop-opacity="0" />
								<stop
									offset="0.5"
									stop-color="#fff"
									stop-opacity={rayStyle.brightness}
								/>
								<stop offset="1" stop-color="#fff" stop-opacity="0" />
							</radialGradient>
						</defs>
						<g fill="url(#giving-tuesday-rays)">
							{#each rays as d, index (index)}
								<path {d} />
							{/each}
						</g>
					</svg>
					<img
						class="relative h-auto w-full"
						src={asset("/images/anniversary-60-reversed.svg")}
						alt="Post Playhouse, established 1967, celebrating 60 years"
					/>
				</div>
			</div>
			<div
				class="absolute right-0 bottom-[13%] flex w-[23%] items-center justify-center rounded-l-[100cqw] bg-[#34477b] py-[3cqw]"
			>
				<svg
					class="w-[60%] text-white"
					viewBox="580 755 1010 802"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						d="M1375.11 759.116C1321.64 759.619 1273.1 780.43 1236.52 813.908L791.586 1258.77L850.381 1317.59L1406.77 761.429C1396.42 759.921 1385.96 758.915 1375.11 759.016"
					/>
					<path
						d="M1492.2 793.7L909.477 1376.8L968.272 1435.72L1550.99 852.614C1535.51 829.29 1515.51 809.082 1492.2 793.7Z"
					/>
					<path
						d="M1585.67 965.615C1585.67 956.064 1584.66 946.915 1583.35 937.767L1026.87 1494.23L1085.76 1553.04L1534.01 1104.86C1566.57 1067.66 1586.37 1018.9 1585.77 965.615"
					/>
					<path
						d="M795.807 759.116C849.275 759.619 897.818 780.43 934.402 813.908L1379.33 1258.77L1320.54 1317.59L764.149 761.429C774.5 759.921 784.953 758.915 795.807 759.016"
					/>
					<path
						d="M678.72 793.7L1261.44 1376.8L1202.65 1435.72L619.926 852.614C635.403 829.29 655.404 809.082 678.72 793.7Z"
					/>
					<path
						d="M585.252 965.615C585.252 956.064 586.257 946.915 587.564 937.767L1144.05 1494.23L1085.16 1553.04L636.911 1104.86C604.348 1067.66 584.549 1018.9 585.152 965.615"
					/>
				</svg>
			</div>
		</div>

		<p class="mt-6 text-xl">
			At Post Playhouse, we’re celebrating 60 years of bringing stories to life,
			creating unforgettable experiences, and making professional theatre part
			of the fabric of western Nebraska. But this isn’t possible without the
			generosity of people like you who believe in the importance of Post
			Playhouse in our community.
		</p>

		<p class="mt-6 text-xl">
			We invite you to be part of our 60th anniversary by making a gift this
			Giving Tuesday. As we celebrate 60 years, help us make the next 60 even
			more extraordinary!
		</p>

		<DonateBtn />
	</div>
{/if}

<div class="mx-auto mb-16 max-w-3xl p-2">
	<h2 class="h1 my-8">Announcing our 2027 Season!</h2>

	<p class="my-8 text-3xl">
		Our 60th anniversary season features <em>Annie</em>,
		<em>The Drowsy Chaperone</em>, <em>Footloose</em>,
		<em>The Addams Family</em>, and
		<em>Honky Tonk Angels</em>.
	</p>

	<enhanced:img
		src={seasonAnnouncement}
		class="h-auto w-full shadow-lg"
		alt="Show logos for Annie, The Drowsy Chaperone, Footloose, The Addams Family, and Honky Tonk Angels in the 2027 Post Playhouse season"
	></enhanced:img>

	<p class="my-8 text-2xl">Performance dates and tickets are coming soon.</p>

	<p class="my-8 text-3xl">
		Special thanks to our Season Sponsors returning for next summer!
	</p>

	<SponsorPlate />
</div>

<div class="flex-row-reverse items-stretch md:flex">
	<section class=" mb-2">
		<a href="/donate">
			<img
				alt="actors making a heart with their arms"
				src="/images/perennials/donations.jpg"
			/>
		</a>
	</section>

	<div class="flex-col md:mr-2 md:flex">
		<section
			class="mb-2 flex-initial bg-green-200 p-3
      dark:bg-green-900"
		>
			<header class="text-xl">Join our mailing list</header>
			<p>Stay informed about what’s happening at Post Playhouse</p>
			<button onclick={toggleMailingList} class="btn px-4 py-2"
				>Join now!</button
			>
		</section>

		<section
			class="mb-2 flex flex-1 flex-col bg-green-200 p-3 dark:bg-green-900"
		>
			<header class="text-xl">Stay connected with Post</header>
			<div class="flex flex-1 flex-wrap items-center justify-around">
				<a
					class="block h-24 w-24 p-2 hover:bg-green-300 md:h-16 md:w-16"
					href="http://facebook.com/post.playhouse"
				>
					<img src="/images/facebook-logo.svg" alt="Facebook logo" />
				</a>
				<a
					class="block h-24 w-24 p-2 hover:bg-green-300 md:h-16 md:w-16"
					href="http://twitter.com/postplayhouse"
				>
					<img src="/images/twitter-bird.svg" alt="Twitter logo" />
				</a>
			</div>
		</section>
	</div>
</div>

{#if showMailingList}
	<Modal onClose={toggleMailingList}>
		<Mailer />
	</Modal>
{/if}
