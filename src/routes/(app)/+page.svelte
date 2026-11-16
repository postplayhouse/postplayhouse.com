<script lang="ts">
	import Mailer from "$components/Mailer.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import ProductionEntry from "$components/Production.svelte"
	import SponsorPlate from "$components/SponsorPlate.svelte"
	import * as site from "$data/site"
	import seasonAnnouncement from "./2027-season-announcement.jpg?enhanced"

	let { data } = $props()

	const { productions, season } = $derived(data)
	const annie = $derived(
		(productions as Production[]).find(
			(production) => production.title === "Annie",
		),
	)
	const logoOptions = [
		{
			label: "Option A: Two-line sponsor credits",
			image: "annie-sponsors.png",
		},
		{
			label: "Option B: Simplified sponsor credits",
			image: "annie-simplified-sponsors.png",
		},
	]

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

{#if annie}
	<section id="sponsor-logo-preview" class="mb-16">
		<h1 class="h1 mb-4">2027 sponsor logo preview</h1>
		<p>
			Compare Liz’s two Annie sponsor treatments below in our regular production
			layout. The repeated show is intentional for this preview. Please check
			both versions on a narrow screen as well as a desktop to compare sponsor
			readability.
		</p>
		{#each logoOptions as option}
			<section aria-label={option.label} class="mt-12">
				<h2 class="h3">{option.label}</h2>
				<ProductionEntry
					production={{ ...annie, image: option.image }}
					{season}
				/>
			</section>
		{/each}
	</section>
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
