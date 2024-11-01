<script lang="ts">
	import Mailer from "$components/Mailer.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import Openings from "$components/OpeningAnnouncements.svelte"
	import SeasonImage from "$components/SeasonImage.svelte"

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

<div class="mb-16 p-2 max-w-3xl mx-auto">
	<Openings {productions} closingDate="2025-08-10">
		{#snippet seasonArtworkImage()}
			<ul
				class="border-t-4 grid grid-cols-1 max-w-[30rem] lg:max-w-full lg:grid-cols-2 gap-2 items-center dark:bg-white/80 rounded list-none"
			>
				<li>
					<SeasonImage
						class="max-w-full block md:float-left md:w-3/5 md:mr-4 md:max-w-4xl bg-white/70"
						imageFile="guys-n-dolls.jpg"
						season="2025"
						alt="Show Logo for guys-n-dolls"
					></SeasonImage>
				</li>
				<li>
					<SeasonImage
						class="max-w-full block md:float-left md:w-3/5 md:mr-4 md:max-w-4xl bg-white/70"
						imageFile="nunsense-jamboree.jpg"
						season="2025"
						alt="Show Logo for nunsense-jamboree"
					></SeasonImage>
				</li>
				<li>
					<SeasonImage
						class="max-w-full block md:float-left md:w-3/5 md:mr-4 md:max-w-4xl bg-white/70"
						imageFile="newsies.jpg"
						season="2025"
						alt="Show Logo for newsies"
					></SeasonImage>
				</li>
				<li>
					<SeasonImage
						class="max-w-full block md:float-left md:w-3/5 md:mr-4 md:max-w-4xl bg-white/70"
						imageFile="lucky-stiff.jpg"
						season="2025"
						alt="Show Logo for lucky-stiff"
					></SeasonImage>
				</li>
				<li>
					<SeasonImage
						class="max-w-full block md:float-left md:w-3/5 md:mr-4 md:max-w-4xl bg-white/70"
						imageFile="into-the-woods.jpg"
						season="2025"
						alt="Show Logo for into-the-woods"
					></SeasonImage>
				</li>
			</ul>
			<!-- <div class="w-full m-auto rounded-lg overflow-clip">
				<SeasonImage
					season="2025"
					imageFile="full-season.jpg"
					alt="2024 season logos: Guys & Dolls, Nunsense Jamboree, Disney's Newsies, Lucky Stiff, and Into The Woods"
				/>
			</div> -->
		{/snippet}
	</Openings>
</div>

<div class="md:flex flex-row-reverse items-stretch">
	<section class=" mb-2">
		<a href="/donate">
			<img
				alt="actors making a heart with their arms"
				src="/images/perennials/donations.jpg"
			/>
		</a>
	</section>

	<div class="md:flex flex-col md:mr-2">
		<section
			class="bg-green-200 dark:bg-green-900 p-3 flex-initial
      mb-2"
		>
			<header class="text-xl">Join our mailing list</header>
			<p>Stay informed about what’s happening at Post Playhouse</p>
			<button onclick="{toggleMailingList}" class="btn px-4 py-2"
				>Join now!</button
			>
		</section>

		<section
			class="bg-green-200 dark:bg-green-900 p-3 flex-1 mb-2 flex flex-col"
		>
			<header class="text-xl">Stay connected with Post</header>
			<div class="flex flex-wrap justify-around items-center flex-1">
				<a
					class="block w-24 h-24 md:w-16 md:h-16 p-2 hover:bg-green-300"
					href="http://facebook.com/post.playhouse"
				>
					<img src="/images/facebook-logo.svg" alt="Facebook logo" />
				</a>
				<a
					class="block w-24 h-24 md:w-16 md:h-16 p-2 hover:bg-green-300"
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
