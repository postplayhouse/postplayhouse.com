<script lang="ts">
	import SeasonImage from "$components/SeasonImage.svelte"
	export const title = "Announcing our 2022 season!"
</script>

<p class="my-2">
	We are so happy to be back, and we can't wait for you to see these wonderful
	shows!
</p>

<div class="m-auto w-2/3">
	<SeasonImage
		season="2022"
		imageFile="full-season.jpg"
		alt="2022 season logos: The Sound of Music, Damn Yankees, Chuch Basement Ladies, Desperate Measures, and Something Rotten!"
	/>
</div>

<section class="space-y-2">
	<h2 class="h2">And one more thing... we have a new tickets site!</h2>

	<p>
		We are also announcing that we've changed our online tickets provider. This
		means you'll see a different looking site when you go to purchase your
		tickets.
	</p>

	<p>
		When we changed over to the new site, we were not able to bring your old
		passwords along with us. This is a good thing for security, but it does add
		one step to your first sign in attempt:
	</p>

	<p>
		<strong>When you log in for the first time on the new site</strong>, you'll
		need to use the “forgot password” function to reset your password.
	</p>
</section>
