<script lang="ts">
	import Mailer from "$components/Mailer.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import Openings from "$components/Openings/Openings.svelte"

	import DonateBtn from "$components/DonateBtn.svelte"
	import { isToday } from "date-fns"
	import givingTuesday1 from "../../images/seasons/2025/giving-tuesday-lion.png?enhanced"
	import givingTuesday2 from "../../images/seasons/2025/giving-tuesday-cast.png?enhanced"
	import givingTuesday3 from "../../images/seasons/2025/giving-tuesday-dorothy.png?enhanced"
	import { dev } from "$app/environment"

	let { data } = $props()

	const { productions, season } = data

	let showMailingList = $state(false)

	function toggleMailingList() {
		showMailingList = !showMailingList
	}
</script>

<svelte:head>
	<title>Post Playhouse</title>

	<meta
		name="description"
		content="Post Playhouse is Northwestern Nebraska's favorite live theatre company"
	/>
	<link rel="canonical" href="https://postplayhouse.com" />

	<!-- Facebook Meta Tags -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Post Playhouse" />
	<meta
		property="og:description"
		content="Post Playhouse is Northwestern Nebraska's favorite live theatre company"
	/>
</svelte:head>

{#if isToday(dev ? new Date() : new Date("2025-12-02T00:00:00.000"))}
	<div class="mx-auto mb-16 block max-w-2xl p-6">
		<p class="mb-6 text-xl font-bold">
			It’s #GivingTuesday2025 — Celebrate Radical Generosity!
		</p>
		<div class="flex gap-2 md:-mx-[60px] lg:-mx-[190px] xl:-mx-[300px]">
			<enhanced:img
				class="-rotate-2 shadow-md"
				src={givingTuesday1}
				alt="Giving Tuesday logo next to a moment from Post's recent production of The Wizard of Oz. The cowardly lion waves his paw at his loyal subjects as he dreams of being king of the forest."
			></enhanced:img>
			<enhanced:img
				class="hidden rotate-3 shadow-md md:block"
				src={givingTuesday2}
				alt="Giving Tuesday logo next to a moment from Post's recent production of The Wizard of Oz. The entire cast stands together, smiling and waving at the audience."
			></enhanced:img>
			<enhanced:img
				class="hidden rotate-2 shadow-md md:block"
				src={givingTuesday3}
				alt="Giving Tuesday logo next to a moment from Post's recent production of The Wizard of Oz. Dorothy stands center stage, singing Somewhere Over the Rainbow."
			></enhanced:img>
		</div>

		<p class="mt-6">
			Today, the world unites to give, share, and uplift. Join millions
			celebrating the power of generosity and help keep the magic of live
			theater shining in rural Nebraska!
		</p>

		<DonateBtn />
	</div>
{/if}

<div class="mx-auto mb-16 max-w-3xl p-2">
	<Openings {season} {productions} />
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
