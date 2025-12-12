<script lang="ts">
	import { dev } from "$app/environment"
	import { page } from "$app/stores"
	import type { Snippet } from "svelte"
	import type { LayoutData } from "./$types"

	// Bare reference to page just to keep eslint happy
	// https://github.com/sveltejs/eslint-plugin-svelte/issues/652
	page

	type Props = { children: Snippet; data: LayoutData }

	let { children, data }: Props = $props()
	const { posts } = $derived(data)
	// get prev and next post
	const currentSlug = $page.url.pathname.split("/").filter(Boolean).at(-1)
	const currentPostIndex = $derived(
		posts.findIndex((post) => post.year === currentSlug) ?? 0,
	)
	const nextPost = $derived(posts.at(currentPostIndex - 1))
	const prevPost = $derived(posts.at((currentPostIndex + 1) % posts.length))
</script>

{#if dev && $page.url.pathname !== "/news/"}
	<div class="mb-8 inline-flex items-baseline gap-8">
		Dev stuff:
		<a class="btn-p" href="/news">Back to News</a>

		{#if prevPost}
			<a class="btn-p" href={`/news/${prevPost.year}`}>Previous Post</a>
		{/if}

		{#if nextPost}
			<a class="btn-p" href={`/news/${nextPost.year}`}>Next Post</a>
		{/if}
	</div>
{/if}

{@render children()}
