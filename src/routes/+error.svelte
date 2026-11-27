<script lang="ts">
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import MainLayout from "$components/layouts/MainLayout.svelte"


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

<!-- Use shared Tailwind styles: SvelteKit eagerly preloads this page even on successful visits. -->
<MainLayout>
	<h1 class="m-[0_0_0.5em] text-[2.8em] font-bold min-[480px]:text-[4em]">
		{$page.status}
	</h1>
	<p class="mx-auto my-[1em]">{$page.error?.message}</p>

	{#if $page.status === 404}
		<p class="mx-auto my-[1em]">
			You can try to find what you're looking for by going to the{" "}
			<a href="/">home page</a>.
		</p>
	{/if}
</MainLayout>
