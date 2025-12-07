<script lang="ts">
	import * as site from "$data/site"
	import { dateIsBetween } from "$helpers"
	const title = "Gifts"

	const now_year = new Date().getFullYear()
	const is_holidays = dateIsBetween(`10/01/${now_year}`, `12/15/${now_year}`)

	const certificatesAreAvailable = true
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<h1 class="h1">{title}</h1>

{#if is_holidays && certificatesAreAvailable}
	<div
		class="my-4 space-y-1.5 border-2 border-green-800 bg-green-100 p-4 dark:bg-green-900"
	>
		<h2 class="h2 dark:text-green-300">Holiday Gift Extras</h2>

		<p>
			No matter when you purchase a Season Subscription or Gift Certificate, you
			can always print them from downloadable files below. However, during the
			holidays, we like to lend a hand.
		</p>

		<p>
			If you've purchased a Season Subscription or a Gift Certificate prior to
			December 15th through our <a class="link-green" href={site.ticketsLink}
				>Online Box Office</a
			>, we will contact you via email and ask if you would like us to send you
			a Subscription Card or Gift Certificate to present as a gift. Just reply
			to the email we sent you and we'll ship the cards to you before December
			25th.
		</p>
	</div>
{/if}

{#if !certificatesAreAvailable}
	<div>
		We will have the certificates and subscription cards available to print
		directly from this page. So please check back here after December 1st.
	</div>
{:else}
	<p class="my-4">
		When you buy a gift via our
		<a class="link-green" href={site.ticketsLink}>Online Box Office</a>, you can
		print off any of our certificates/subscription cards below and give them to
		the recipient. Subscribers: even if it's not a gift, print off a
		subscription card for a convenient place to write down all the information
		about your shows after you reserve them.
	</p>

	<h2 class="h2">{site.season} Gift Certificate</h2>

	<p>Click to download.</p>

	<p>
		<a
			href="/documents/{site.season}/gift-certificate.pdf"
			download
			class="mb-8 inline-block border-2 border-transparent hover:border-green-800"
			><img
				src="/documents/{site.season}/gift-certificate.jpg"
				alt="Gift Certificate"
				class="max-w-md"
			/></a
		>
	</p>

	<h2 class="h2">{site.season} Season Subscription Card</h2>

	<p>Click to download.</p>

	<p>
		<a
			href="/documents/{site.season}/subscription-card.pdf"
			download
			class="mb-8 inline-block border-2 border-transparent hover:border-green-800"
			><img
				src="/documents/{site.season}/subscription-card.jpg"
				alt="Subscription Card"
				class="max-w-md"
			/></a
		>
	</p>

	<h2 class="h2">Post Playhouse Season Subscription Presentation Card</h2>

	<p>Click to download.</p>

	<p>
		<a
			href="/documents/subscription-presenter.pdf"
			download
			class="mb-8 inline-block border-2 border-transparent hover:border-green-800"
			><img
				src="/documents/subscription-presenter.png"
				alt="Subscription Presentation Card"
				class="max-w-md border-2 border-gray-200"
			/></a
		>
	</p>
{/if}
