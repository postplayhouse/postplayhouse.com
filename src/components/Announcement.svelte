<script lang="ts">
	import type { Snippet } from "svelte"
	import HideOnDate from "./HideOnDate.svelte"

	type Props = {
		title: string | Snippet
		children: Snippet
		readMoreText?: string
		readMoreLink?: string
		/** YYYY-MM-DD */
		expirationDate?: `${number}-${number}-${number}`
	}

	let {
		title,
		children,
		readMoreText = "Read more",
		readMoreLink,
		expirationDate = "2099-01-01",
	}: Props = $props()
</script>

{#snippet renderedTitle()}
	{#if typeof title === "string"}
		{title}
	{:else}
		{@render title()}
	{/if}
{/snippet}

<HideOnDate date={expirationDate}>
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
					{@render renderedTitle()}
				</a>
			{:else}
				{@render renderedTitle()}
			{/if}
		</h1>
		{@render children()}

		{#if readMoreLink}
			<div class="link-green mt-2 text-right">
				{readMoreText}
			</div>
		{/if}
	</div>
</HideOnDate>
