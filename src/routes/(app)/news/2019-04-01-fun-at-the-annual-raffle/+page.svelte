<script lang="ts">
	import Markdown from "$components/Markdown.svelte"
	import SeasonImage from "$components/SeasonImage.svelte"
	export const title = "Annual Raffle Winners"

	const images = [
		"post-raffle-2019_1.jpg",
		"post-raffle-2019_2.jpg",
		"post-raffle-2019_3.jpg",
		"post-raffle-2019_4.jpg",
		"post-raffle-2019_5.jpg",
		"post-raffle-2019_6.jpg",
		"post-raffle-2019_7.jpg",
		"post-raffle-2019_8.jpg",
		"post-raffle-2019_9.jpg",
		"post-raffle-2019_10.jpg",
		"post-raffle-2019_11.jpg",
		"post-raffle-2019_12.jpg",
		"post-raffle-2019_13.jpg",
		"post-raffle-2019_14.jpg",
		"post-raffle-2019_15.jpg",
		"post-raffle-2019_16.jpg",
	]
</script>

<Markdown
	source={`Thanks to all those who bought tickets and came out to support the playhouse! Congrats to the lucky winners:

- $5,000 --- Judy Sample
- $1,000 --- Kevin Kelso
- $1,000 --- Vicki Eitemiller
- $1,000 --- Dan Otte
- $1,000 --- Vincent Ryan
- $1,000 --- Joe Vogel
- $500 --- Tracy Jatczak
- $500 --- Beth Forney
- $500 --- Kim Haas
- $500 --- Trampas Belknap
- $100 --- Jim and Barb Keegan
- $100 --- Jamie Wada
- $100 --- Cassie and John Ritzen
- $100 --- Nebraska Total Office
- $100 --- Joelene Tallman Savin
- $100 --- Gary and Laurie Gould
- $100 --- Ben Watson
- $100 --- Mike Shald
- $100 --- Wally and Jodi Mischnick
- $100 --- Dustin Chester
- $100 --- Jana Goranson
- $100 --- Tim Horn
- $100 --- Janelle Viser
- $100 --- Kirk Wilson
- $100 --- Kyren Conley
- $100 --- Tina Pryor
- $100 --- Katie Dobson
- $100 --- Stephanie Graham
- $100 --- Morford's Decorating
- $100 --- Kirk Wilson
- $100 --- Randy Rhine and Grandchildren
- $100 --- Frannie Roberts
- $100 --- Mandy Plog
- $100 --- Sharon Rickenbach`}
/>

<div class="flex flex-wrap gap-4">
	{#each images as image}
		<SeasonImage
			season="2019"
			imageFile="raffle/{image}"
			alt="2019 raffle scene"
		/>
	{/each}
</div>
