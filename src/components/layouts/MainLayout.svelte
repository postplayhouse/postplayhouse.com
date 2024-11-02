<script lang="ts">
	import { page } from "$app/stores"
	import Nav from "$components/Nav.svelte"
	import Header from "$components/Header.svelte"
	import Footer from "$components/Footer.svelte"
	import type { Snippet } from "svelte"

	// Bare reference to page just to keep eslint happy
	// https://github.com/sveltejs/eslint-plugin-svelte/issues/652
	page

	type Props = {
		unconstrainedWidth?: boolean
		children: Snippet
	}
	let { unconstrainedWidth = false, children }: Props = $props()
</script>

<div class="dark:bg-[#0f110f] dark:text-white/90">
	<Header />
	<Nav activePath="{$page.url.pathname}" />

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
