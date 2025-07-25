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

<Announcement expirationDate="2025-08-03">
	{#snippet title()}
		Post Playhouse's Annual Cabaret<br /> August 4th!
	{/snippet}
	<Markdown
		source={`
You're warmly invited to join the cast and company of Post Playhouse for our _annual Cabaret & Fundraiser_ on **Monday, August 4th at 7 PM** — an unforgettable evening of celebration, music, and community!

This special night will shine a spotlight on our exciting **2025 season**, feature exclusive performances, and offer a sneak peek at what’s coming in our soon-to-be-announced **2026 season**!

**Every dollar raised supports** our nonprofit mission and helps us continue to bring top-tier professional talent from across the country to our cherished corner of Nebraska.

**Complimentary hors d’oeuvres and a selection of beverages** are included with your donation.

**There are just a few seats left, and it's first come, first serve! So, RSVP today to secure your space!**

Email us at [**tickets@postplayhouse.com**](mailto:tickets@postplayhouse.com) with your name, number of guests, and the donation amount you plan to contribute.

**How to Donate:**
- Bring a check with you that evening
- Donate online at [postplayhouse.com/donate](https://postplayhouse.com/donate) and write “Cabaret” in the memo  
- Or mail a check to:  
  **Post Playhouse**  
  ℅ Jim Gardner, Casey Peterson LTD  
  PO Box 447  
  Chadron, NE 69337
    

We kindly suggest a donation of **$25 or more per guest**.

Let’s make this a night to remember. We can't wait to celebrate with you on **August 4th**!
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
