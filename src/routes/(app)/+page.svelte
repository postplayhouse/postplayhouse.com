<script lang="ts">
	import Announcement from "$components/Announcement.svelte"
	import Mailer from "$components/Mailer.svelte"
	import Markdown from "$components/Markdown.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import Openings from "$components/Openings/Openings.svelte"

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

<Announcement readMoreLink="/news/2025-08-11-ann-stephens-award">
	{#snippet title()}
		Post Playhouse Honors Behind-the-Scenes Legacy and Community Support with
		Two Major Announcements
	{/snippet}
	<Markdown
		source={`
### The new Ann Stephens Award celebrates impact, while the Annual Cabaret raises Nearly $8,500 for the future of the Post Playhouse, Inc.

Post Playhouse is proud to announce two milestones that highlight its deep-rooted legacy and thriving community support. At the Annual Cabaret on Aug. 4, 2025, Artistic Director Dewayne Barrett announced the inaugural Ann Stephens Award, a new annual honor that recognizes the recipient’s extraordinary behind-the-scenes contributions to Post Playhouse. In addition, Post Playhouse patrons who attended the Annual Cabaret helped the Post Playhouse raise nearly $8,500 towards its 2026 season.
	`}
	/>
</Announcement>

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
