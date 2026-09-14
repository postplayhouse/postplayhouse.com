<script lang="ts">
	import Announcement from "$components/Announcement.svelte"
	import Mailer from "$components/Mailer.svelte"
	import Markdown from "$components/Markdown.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import Openings from "$components/Openings/Openings.svelte"
	import SponsorPlate from "$components/SponsorPlate.svelte"
	import * as site from "$data/site"

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

<Announcement readMoreLink="/news/2026-09-09-south-fork-fire-support">
	{#snippet title()}
		Post Playhouse receives strong support following South Fork Fire; looks
		ahead to 60th anniversary season
	{/snippet}
	<Markdown
		source={`
When the South Fork Fire swept through Fort Robinson State Park in June, the entire company of Post Playhouse was evacuated, three performances were cancelled, and emergency expenses and lost attendance created an unexpected financial challenge for the nonprofit theatre.

Through its Wildfire Recovery Fund, Post Playhouse exceeded its $45,000 goal thanks to generous support from more than 100 individuals across the country and several significant gifts. Together, this support has put Post Playhouse in a strong position as the organization looks toward its 60th anniversary season in summer 2027.
	`}
	/>
</Announcement>

<div class="mx-auto mb-16 max-w-3xl p-2">
	<h3 class="h1 my-8">Our 2027 Season will be announced soon...</h3>

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
