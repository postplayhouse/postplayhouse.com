<script lang="ts">
	import site from "$data/site"
	import TicketsButton from "./TicketsButton.svelte"
</script>

<header
	class="mx-auto flex max-w-4xl flex-col items-center justify-around sm:flex-row"
>
	<div class="max-w-xl flex-auto">
		<a href="{site.baseurl}/" title="Post Playhouse" rel="home">
			<img
				src="{site.baseurl}/images/post-nameplate-colors.svg"
				alt="Post Playhouse Title Logo"
				class="dark:hidden"
			/><img
				src="{site.baseurl}/images/post-nameplate-colors_dark.svg"
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

	<div class="ml-2 mt-8 min-w-md flex-initial text-center">
		<TicketsButton />

		<a class="link-green sm:mt-4 sm:block" href="{site.baseurl}/ticket-info/">
			Ticket Information
		</a>
		<a class="mt-2 block text-lg" href="{site.boxOfficePhoneLink}">
			{site.boxOfficePhone}
		</a>
	</div>
</header>
