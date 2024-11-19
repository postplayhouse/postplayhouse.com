<script lang="ts">
	let { data } = $props()

	const { seasons } = data
	const years = Object.keys(seasons)
</script>

<ul>
	{#each years as year}
		<li><a href={`/who/${year}`}>{year}</a></li>
	{/each}
</ul>
