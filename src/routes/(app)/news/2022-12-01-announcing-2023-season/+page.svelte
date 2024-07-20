<script lang="ts">
	import TicketsButton from "$components/TicketsButton.svelte"
	import SeasonImage from "$components/SeasonImage.svelte"
	import site from "$data/site"
	export const title = "Announcing our 2023 Season!"
</script>

<div class="w-full max-w-2xl m-auto">
	<SeasonImage
		season="2023"
		imageFile="full-season.jpg"
		alt="2023 season logos: Leader of the Pack, Clue the Musical, Joseph and the Amazing Technicolor Dreamcoat, You're a Good Man Charlie Brown, The Spitfire Grill"
	/>
</div>

<section class="space-y-2 mt-6">
	<p>
		Give the joy of live theatre this holiday season! Don't miss your
		opportunity to purchase ticket packages for your friends and loved ones this
		season.
	</p>
</section>

{#if site.season === 2023}
	<div class="flex justify-center m-4">
		<TicketsButton />
	</div>
{/if}
