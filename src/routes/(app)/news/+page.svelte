<script lang="ts">
	let { data } = $props()

	const { posts } = data
</script>

<svelte:head>
	<title>News</title>
</svelte:head>

<h1>Recent posts</h1>

<ul>
	{#each posts as post}
		<!-- we're using the non-standard `rel=prefetch` attribute to
				tell Sapper to load the data for the page as soon as
				the user hovers over the link or taps it, instead of
				waiting for the 'click' event -->
		<li>
			<a rel="prefetch" href="/news/{post.year}">
				<span>{post.date}</span>
				{post.title}
			</a>
		</li>
	{/each}
</ul>

<style>
	ul {
		margin: 0 0 1em 0;
		line-height: 1.5;
	}

	span {
		font-feature-settings: "tnum";
	}
</style>
