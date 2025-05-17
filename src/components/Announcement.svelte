<script lang="ts">
	import type { Snippet } from "svelte"

	type Props = {
		title: string
		children: Snippet
		readMoreText?: string
		readMoreLink?: string
	}

	let {
		title,
		children,
		readMoreText = "Read more",
		readMoreLink,
	}: Props = $props()
</script>

<div
	class={[
		"mx-auto mb-16 block max-w-2xl border border-green-400 bg-green-100 p-6 shadow-md dark:border-green-500 dark:bg-green-900/20",
		readMoreLink &&
			"group relative isolate block transform-gpu transition-all hover:scale-105 hover:shadow-lg",
	]}
>
	<h1 class="h2 mb-2">
		{#if readMoreLink}
			<a class="group-hover:underline" href={readMoreLink}>
				<span class="absolute inset-0 z-10"></span>
				{title}
			</a>
		{:else}
			{title}
		{/if}
	</h1>
	{@render children()}

	{#if readMoreLink}
		<div class="link-green mt-2 text-right">
			{readMoreText}
		</div>
	{/if}
</div>
