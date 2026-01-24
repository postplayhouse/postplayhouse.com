<script lang="ts">
	import { isBefore, startOfToday } from "date-fns"
	import type { Snippet } from "svelte"

	type Props = {
		children: Snippet
		/** YYYY-MM-DD - Content will be hidden on and after this date */
		date: `${number}-${number}-${number}`
	}

	let { children, date }: Props = $props()
</script>

{#if isBefore(startOfToday(), new Date(`${date}T00:00:00.000`))}
	{@render children()}
{/if}
