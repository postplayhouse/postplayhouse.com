<script lang="ts">
	import { allYears } from "$data/site"

	const yearsWithCalendars = allYears.filter((y) => y >= 2020)

	const routes = [
		"/",
		"/bio-submission",
		"/calendar",
		"/productions",
		"/jobs/feeds/rss",
		"/jobs/feeds/json",
	]
		.concat(allYears.map((y) => `/productions/${y}`))
		.concat(allYears.map((y) => `/who/${y}`))
		.concat(yearsWithCalendars.map((y) => `/calendar/${y}`))
</script>

<ul>
	{#each routes as route}
		<li><a href={route}>{route}</a></li>
	{/each}
</ul>
