<script lang="ts">
	import { yearsWithCalendars, yearsWithPages } from "$data/site"

	const routes = [
		"/",
		"/bio-submission",
		"/calendar",
		"/productions",
		"/jobs/feeds/rss",
		"/jobs/feeds/json",
	]
		.concat(yearsWithPages.map((y) => `/productions/${y}`))
		.concat(yearsWithPages.map((y) => `/who/${y}`))
		.concat(yearsWithCalendars.map((y) => `/calendar/${y}`))
</script>

<ul>
	{#each routes as route}
		<li><a href={route}>{route}</a></li>
	{/each}
</ul>
