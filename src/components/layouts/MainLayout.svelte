<script lang="ts">
	import { page } from "$app/stores"
	import Nav from "$components/Nav.svelte"
	import Header from "$components/Header.svelte"
	import Footer from "$components/Footer.svelte"
	import ThemeToggle from "$components/ThemeToggle.svelte"
	import { url } from "$data/site"
	import type { Snippet } from "svelte"

	// Bare reference to page just to keep eslint happy
	// https://github.com/sveltejs/eslint-plugin-svelte/issues/652
	page
	const socialImage = `${url}/images/playhouse-pic-large.jpg`

	type Props = {
		unconstrainedWidth?: boolean
		children: Snippet
	}
	let { unconstrainedWidth = false, children }: Props = $props()
</script>

<svelte:head>
	<meta property="og:image" content={socialImage} />
	<meta property="og:image:width" content="700" />
	<meta property="og:image:height" content="442" />
	<meta property="og:image:alt" content="The exterior of Post Playhouse" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={socialImage} />
	<meta name="twitter:image:alt" content="The exterior of Post Playhouse" />
</svelte:head>

<div class="dark:bg-[#0f110f] dark:text-white/90">
	<ThemeToggle />
	<Header />
	<Nav activePath={$page.url.pathname} />

	<main class="relative m-auto px-2 py-8 sm:px-8">
		{#if unconstrainedWidth}
			{@render children()}
		{:else}
			<div class="mx-auto max-w-[56em]">
				{@render children()}
			</div>
		{/if}
	</main>

	<Footer />
</div>
