<script lang="ts">
	import { resolve } from "$app/paths"
	import * as site from "$data/site"
	import AnniversaryLogo from "./AnniversaryLogo.svelte"
	import TicketsButton from "./TicketsButton.svelte"
</script>

<header
	class="mx-auto grid max-w-5xl justify-items-center gap-3 px-4 pt-6 pb-4 md:grid-cols-[minmax(0,28rem)_minmax(0,26rem)] md:items-center md:justify-center md:gap-x-12 md:gap-y-12 md:px-6 md:py-6"
>
	<a
		href={resolve("/")}
		title="Post Playhouse home"
		rel="home"
		class="block w-full max-w-md rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700 md:row-span-2 md:max-w-100"
	>
		<AnniversaryLogo />
		<h1 class="sr-only">Post Playhouse</h1>
	</a>

	<h2
		class="max-w-md min-w-0 text-center text-xl leading-snug font-thin tracking-wide md:self-end md:text-2xl"
	>
		Professional talent from across the country...
		<span style="white-space:nowrap">So close to home</span>
	</h2>

	<div
		class="flex w-full max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center md:self-start"
	>
		<div class="w-full">
			<TicketsButton />
		</div>
		<a class="link-green" href={resolve("/ticket-info/")}> Ticket Info </a>
		<a href={site.boxOfficePhoneLink}>
			{site.boxOfficePhone}
		</a>
	</div>
</header>
