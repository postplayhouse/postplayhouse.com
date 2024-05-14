<script lang="ts">
	import { site } from "$data/site"
	import type { Snippet } from "svelte"

	type Props = {
		year?: number | string
		beforeSponsors?: Snippet
		afterSponsors?: Snippet
	}

	let { year = site.season, afterSponsors, beforeSponsors }: Props = $props()

	const year_ = Number(year)
</script>

{@render beforeSponsors?.()}

{#if year_ === 2023 || year_ === 2024}
	<ul
		class="grid grid-cols-2 max-w-[30rem] lg:max-w-full lg:grid-cols-4 gap-8 grid-flow-dense items-center m-auto dark:bg-white/80 rounded list-none"
	>
		<li>
			<img src="/images/sponsors/csc.png" alt="Chadron State College" />
		</li>
		<li class="lg:col-start-4">
			<img
				src="/images/sponsors/security-first-bank.png"
				alt="Security First Bank"
			/>
		</li>
		<li class="col-span-2 lg:col-start-2">
			<img
				src="/images/sponsors/casey-peterson-financial.png"
				alt="Casey Peterson Financial"
			/>
		</li>
	</ul>
{/if}

{@render afterSponsors?.()}
