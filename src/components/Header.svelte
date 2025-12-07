<script lang="ts">
	import { asset, resolve } from "$app/paths"
	import site from "$data/site"
	import TicketsButton from "./TicketsButton.svelte"
</script>

<header
	class="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-8 p-2 sm:flex-nowrap"
>
	<div class="max-w-xl">
		<a href={resolve("/")} title="Post Playhouse" rel="home">
			<img
				src={asset("/images/post-nameplate-colors.svg")}
				alt="Post Playhouse Title Logo"
				class="dark:hidden"
			/><img
				src={asset("/images/post-nameplate-colors_dark.svg")}
				alt="Post Playhouse Title Logo"
				class="hidden dark:block"
			/>
			<h1 class="hidden">{site.title}</h1>
		</a>
		<h2 class="text-center text-xl font-thin tracking-wide">
			Professional talent from across the country...
			<span style="white-space:nowrap">So close to home</span>
		</h2>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-2 text-center">
		<div class="w-full">
			<TicketsButton />
		</div>
		<a class="link-green" href={resolve("/ticket-info/")}> Ticket Info </a>
		<a href={site.boxOfficePhoneLink}>
			{site.boxOfficePhone}
		</a>
	</div>
</header>
