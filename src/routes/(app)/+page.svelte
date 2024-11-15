<script lang="ts">
	import DonateBtn from "$components/DonateBtn.svelte"
	import Mailer from "$components/Mailer.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import Openings from "$components/OpeningAnnouncements.svelte"
	import SeasonImage from "$components/SeasonImage.svelte"
	import { isToday } from "date-fns"
	import givingTuesday1 from "../../images/seasons/2025/giving-tuesday-lion.png?enhanced"
	import givingTuesday2 from "../../images/seasons/2025/giving-tuesday-cast.png?enhanced"
	import givingTuesday3 from "../../images/seasons/2025/giving-tuesday-dorothy.png?enhanced"

	let { data } = $props()

	const { productions } = data

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

{#if isToday(new Date("2024-12-03T00:00:00.000"))}
	<div class="mx-auto mb-16 block max-w-2xl p-6">
		<div class="flex gap-2 md:-mx-[60px] lg:-mx-[190px] xl:-mx-[300px]">
			<enhanced:img
				class="-rotate-2 shadow-md"
				src="{givingTuesday1}"
				alt="Giving Tuesday logo next to a moment from Post's production of The Wizard of Oz."
			></enhanced:img>
			<enhanced:img
				class="hidden rotate-3 shadow-md md:block"
				src="{givingTuesday2}"
				alt="Giving Tuesday logo next to a moment from Post's production of The Wizard of Oz."
			></enhanced:img>
			<enhanced:img
				class="hidden rotate-2 shadow-md md:block"
				src="{givingTuesday3}"
				alt="Giving Tuesday logo next to a moment from Post's production of The Wizard of Oz."
			></enhanced:img>
		</div>

		<p class="mt-4">
			It’s Giving Tuesday! On this international day of giving, join us and the
			millions of others worldwide by donating! You can make a gift to Post
			Playhouse today! #GenerosityInAction
		</p>

		<DonateBtn />
	</div>
{/if}

<div class="mx-auto mb-16 max-w-3xl p-2">
	<Openings {productions} closingDate="2025-08-10">
		{#snippet seasonArtworkImage()}
			<ul
				class="-m-6 flex list-none flex-wrap items-center justify-center gap-2 rounded bg-green-200 p-6 dark:bg-transparent [&>*]:max-w-96 sm:[&>*]:max-w-60"
			>
				<li
					class="block -rotate-2 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:scale-100 dark:bg-neutral-300 dark:shadow-black/20"
				>
					<SeasonImage
						class="max-w-full mix-blend-multiply"
						imageFile="guys-n-dolls.jpg"
						season="2025"
						alt="Show Logo for guys-n-dolls"
					></SeasonImage>
				</li>
				<li
					class="block rotate-3 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:scale-100 dark:bg-neutral-300 dark:shadow-black/20"
				>
					<SeasonImage
						class="max-w-full mix-blend-multiply"
						imageFile="nunsense-jamboree.jpg"
						season="2025"
						alt="Show Logo for nunsense-jamboree"
					></SeasonImage>
				</li>
				<li
					class="md:rotate dark:scale-100-0 block rotate-2 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:bg-neutral-300 dark:shadow-black/20"
				>
					<SeasonImage
						class="max-w-full mix-blend-multiply"
						imageFile="newsies.jpg"
						season="2025"
						alt="Show Logo for newsies"
					></SeasonImage>
				</li>
				<li
					class="block -rotate-2 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:scale-100 dark:bg-neutral-300 dark:shadow-black/20"
				>
					<SeasonImage
						class="max-w-full mix-blend-multiply"
						imageFile="lucky-stiff.jpg"
						season="2025"
						alt="Show Logo for lucky-stiff"
					></SeasonImage>
				</li>
				<li
					class="block rotate-2 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:scale-100 dark:bg-neutral-300 dark:shadow-black/20"
				>
					<SeasonImage
						class="max-w-full mix-blend-multiply"
						imageFile="into-the-woods.jpg"
						season="2025"
						alt="Show Logo for into-the-woods"
					></SeasonImage>
				</li>
			</ul>
		{/snippet}
	</Openings>
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
			<button onclick="{toggleMailingList}" class="btn px-4 py-2"
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
	<Modal on:close="{toggleMailingList}">
		<Mailer />
	</Modal>
{/if}
