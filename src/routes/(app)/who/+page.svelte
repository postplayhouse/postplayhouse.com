<script lang="ts">
	import { getYearsWithPeople } from "$data/people.remote.js"

	const years = $derived(await getYearsWithPeople())
</script>

<ul>
	{#each years as year}
		<li><a href={`/who/${year}`}>{year}</a></li>
	{/each}
</ul>
