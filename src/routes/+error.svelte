<script lang="ts">
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import MainLayout from "$components/layouts/MainLayout.svelte"

	// Bare reference to page just to keep eslint happy
	// https://github.com/sveltejs/eslint-plugin-svelte/issues/652
	page

	function redirectIfPathMatchesOldNewsRoute() {
		if ($page.status !== 404) return

		// The old routes looked like this:
		//
		//     /news/2021/01/01/this-is-a-news-title
		//
		// The new routes look like this:
		//
		//     /news/2021-01-01-this-is-a-news-title
		const OLD_NEWS_PATH = /^(\/news\/\d{4})(\/)(\d{2})(\/)(\d{2})(\/)(.*)/g

		const matchesOldRoutes = OLD_NEWS_PATH.test(window.location.pathname)

		if (!matchesOldRoutes) return

		const tryLocation = window.location.pathname.replace(
			OLD_NEWS_PATH,
			function (
				_full,
				newsSlashYear,
				_slash1,
				month,
				_slash2,
				day,
				_slash3,
				remainingTitle,
			) {
				return `${newsSlashYear}-${month}-${day}-${remainingTitle}`
			},
		)

		goto(tryLocation)
	}

	onMount(() => {
		redirectIfPathMatchesOldNewsRoute()
	})
</script>

<svelte:head>
	<title>{$page.status}</title>
</svelte:head>

<MainLayout>
	<h1>{$page.status}</h1>
	<p>{$page.error?.message}</p>

	{#if $page.status === 404}
		<p>
			You can try to find what you're looking for by going to the{" "}
			<a href="/">home page</a>.
		</p>
	{/if}
</MainLayout>

<style>
	h1,
	p {
		margin: 0 auto;
	}

	h1 {
		font-size: 2.8em;
		font-weight: 700;
		margin: 0 0 0.5em 0;
	}

	p {
		margin: 1em auto;
	}

	@media (min-width: 480px) {
		h1 {
			font-size: 4em;
		}
	}
</style>
