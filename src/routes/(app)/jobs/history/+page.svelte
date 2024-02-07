<script lang="ts">
	import Markdown from "$components/Markdown.svelte"

	export let data
	const { posts } = data

	const title = "Archive of Job Postings"

	function slugify(str: string) {
		return str.replace(/\W+/g, "-")
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<h1 class="h1">{title}</h1>

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

{#each posts as post}
	<h2 class="h2 font-bold mt-12 mb-4" id="{slugify(post.title)}">
		{post.title}
	</h2>
	<Markdown source="{post.content}" />
{/each}
