<script lang="ts">
	import { page } from "$app/stores"
	import Nav from "$components/Nav.svelte"
	import Header from "$components/Header.svelte"
	import Footer from "$components/Footer.svelte"
	import ThemeToggle from "$components/ThemeToggle.svelte"
	import { url } from "$data/site"
	import type { Snippet } from "svelte"

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

<div
	class="relative isolate overflow-x-clip dark:bg-[#040e09] dark:text-white/90"
>
	<ThemeToggle />
	<div class="site-masthead">
		<div class="site-masthead-content dark">
			<Header />
		</div>
	</div>
	<Nav activePath={$page.url.pathname} />

	<main class="relative m-auto px-2 pt-4 pb-8 sm:px-8">
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

<style>
	.site-masthead {
		--edge-depth: clamp(2rem, 5vw, 4rem);
		--edge-shape: polygon(
			0 0,
			100% 0,
			100% calc(100% - var(--edge-depth)),
			0 100%
		);
		position: relative;
		isolation: isolate;
	}

	.site-masthead-content {
		isolation: isolate;
		overflow: clip;
		padding-bottom: var(--edge-depth);
		background: #000;
		color: rgb(255 255 255 / 90%);
		clip-path: var(--edge-shape);
	}

	:global(html.dark) .site-masthead::after {
		content: "";
		pointer-events: none;
		position: absolute;
		inset: auto 0 -3rem;
		z-index: -1;
		height: calc(var(--edge-depth) + 6rem);
		background: linear-gradient(
			calc(180deg - atan2(var(--edge-depth), 100vw)),
			transparent calc(50% - 8px),
			rgb(57 104 74 / 40%) calc(50% + 4px),
			rgb(57 104 74 / 12%) calc(50% + 16px),
			transparent calc(50% + 40px)
		);
	}
</style>
