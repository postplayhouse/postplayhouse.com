<script lang="ts">
	import site from "$data/site"
	import Markdown from "$components/Markdown.svelte"
	import Modal from "$components/Modal/Modal.svelte"

	export let data
	const { posts } = data

	const title = "Work at Post Playhouse"

	const today = new Date()
	const marchOfCurrentSeason = new Date(site.season, 2)
	const midAugustOfCurrentSeason = new Date(site.season, 7, 20)

	const isAfterCurrentSeason = today > midAugustOfCurrentSeason
	const isBeforeMarchOfCurrentSeason = today < marchOfCurrentSeason

	let showFeedsLinks = false
	const toggleFeedsLinks = () => (showFeedsLinks = !showFeedsLinks)
	function slugify(str: string) {
		return str.replace(/\W+/g, "-")
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<h1 class="h1">{title}</h1>

<div
	class="flex items-center my-4 border border-green-600 bg-green-200 dark:bg-green-900 p-2"
>
	<button class="btn btn-p mr-4" on:click="{toggleFeedsLinks}">
		Subscribe to jobs updates
	</button>
	Never miss an employment opportunity announcement
</div>

{#if posts.length > 1}
	<ul class="list-none">
		{#each posts as post}
			<li class="text-lg">
				Jump to <a class="link-green" href="#{slugify(post.title)}"
					>{post.title}</a
				>
			</li>
		{/each}
	</ul>
{/if}

{#if posts.length}
	{#each posts as post}
		<h2 class="h2 font-bold mt-12 mb-4" id="{slugify(post.title)}">
			{post.title}
		</h2>
		<Markdown source="{post.content}" />
	{/each}
{:else}
	<h2 class="h2 font-bold mt-12 mb-4">There are currently no openings.</h2>
	{#if isAfterCurrentSeason || isBeforeMarchOfCurrentSeason}
		<p>
			We generally hold professional auditions and start looking for summer
			staff in the first quarter of the year.
		</p>
	{/if}
{/if}

{#if showFeedsLinks}
	<Modal on:close="{toggleFeedsLinks}">
		<p class="my-4">
			You can subscribe to our job notifications so you never miss when a new
			job or audition notice goes live:
		</p>

		<ul class="my-4 list-none p-0">
			<li>
				RSS:
				<a class="link-green" href="{site.url}/jobs/feeds/rss"
					>{site.url}/jobs/feeds/rss</a
				>
			</li>
			<li class="mt-2">
				JSON Feed:
				<a class="link-green" href="{site.url}/jobs/feeds/json"
					>{site.url}/jobs/feeds/json</a
				>
			</li>
		</ul>

		<p class="mt-8 text-sm">
			Don't know what those links are? If you have an RSS reader you can give it
			one of the links above (probably the RSS one) and it will subscribe you to
			this page. Kind of like podcasts, but for reading. And instead of giving
			the url above to iTunes (or your favorite podcast player), you'll give it
			to
			<a class="link-green" href="https://netnewswire.com">NetNewsWire</a>,
			<a class="link-green" href="https://feedly.com">Feedly</a>, or your
			favorite RSS app.
		</p>
	</Modal>
{/if}
