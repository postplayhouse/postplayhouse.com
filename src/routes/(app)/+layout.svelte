<script lang="ts">
	import { page } from "$app/stores"
	import Nav from "$components/Nav.svelte"
	import Header from "$components/Header.svelte"
	import Footer from "$components/Footer.svelte"
</script>

<div class="dark:bg-[#0f110f] dark:text-white/90">
	<Header />
	<Nav activePath="{$page.url.pathname}" />

	<main class="relative m-auto py-8 px-2 sm:px-8">
		<slot />
	</main>

	<Footer />
</div>

<style>
	main {
		max-width: 56em;
	}
</style>
