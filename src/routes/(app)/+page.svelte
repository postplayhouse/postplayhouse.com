<script lang="ts">
	import Announcement from "$components/Announcement.svelte"
	import HideOnDate from "$components/HideOnDate.svelte"
	import Mailer from "$components/Mailer.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import Openings from "$components/Openings/Openings.svelte"
	import * as site from "$data/site"
	import Raffle2026 from "./news/2026-01-23-annual-raffle/+page.svelte"

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

<Announcement title="Post Playhouse Update on the South Fork Fire">
	<p class="text-sm text-gray-500 dark:text-gray-400">6/11/2026</p>
	<p>
		The Post Playhouse is grateful for the tremendous outpouring of support
		from our community, patrons, families, and friends as we respond to the
		South Fork Fire.
	</p>
	<p>
		Following emergency protocols and evacuation orders, we are thankful to
		report that all Post Playhouse company members, staff, and volunteers are
		safe and accounted for. We extend our deepest gratitude to the
		firefighters, first responders, emergency personnel, and all frontline
		workers who are working to protect our communities during this challenging
		time.
	</p>
	<p>
		Our theatre's home, Fort Robinson State Park, is central to the Post
		Playhouse experience and a vital cultural, historical, and natural resource
		for our region. We are heartbroken by the devastating damage the park has
		sustained and the impact this fire is having on a place that means so much
		to so many. We are grateful for the support and concern being shown for
		both Fort Robinson and Crawford residents, as well as the dedicated park
		staff working around the clock in incredibly difficult conditions. As
		information continues to evolve, we encourage those seeking updates on fire
		activity, park conditions, and emergency response efforts to follow
		official communications from local authorities and Fort Robinson State
		Park.
	</p>
	<p>
		Following evacuation, we are now working in coordination with emergency
		officials and Fort Robinson staff to safely return to the park today. Once
		on site, we will assess conditions and determine next steps for company
		operations.
	</p>
	<p>
		At this time, many details remain uncertain, and we are taking things one
		step at a time. Our highest priority is the safety and well-being of our
		company members, audiences, and the people throughout our region affected
		by this fire.
	</p>
	<p>
		As a result, all Post Playhouse performances scheduled for today, June 11,
		2026, have been canceled. Patrons with tickets who would like to
		reschedule are encouraged to contact the Box Office at
		<strong>888-665-1976</strong> for assistance.
	</p>
	<p>
		We will continue to share updates as more information becomes available.
		Thank you for your patience, understanding, and support as we navigate
		this situation together.
	</p>
	<p>— Post Playhouse</p>
</Announcement>

<HideOnDate date="2026-03-15">
	<div
		class="-mx-8 border border-green-400 bg-green-100 p-6 shadow-md dark:border-green-500 dark:bg-green-900/20"
	>
		<Raffle2026 />
	</div>
</HideOnDate>

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
