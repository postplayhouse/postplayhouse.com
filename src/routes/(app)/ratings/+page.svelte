<script lang="ts">
	export let data
	const { productions } = data
</script>

<div class="via-markdown">
	<p>
		Starting in 2017, all of our productions have been labelled with an
		unofficial rating. We say “unofficial” because we are not adhering to any
		sort of national standard for theatre ratings, since no such thing exists.
	</p>

	<p>
		We do, however, want to provide a little bit of guidance to our patrons. For
		now, we are using two ratings: G and H. The first rating, G, resembles the
		movie rating of the same name and is meant to imply as much. G is what we
		consider suitable for audiences of any age. H is meant to imply that the
		show may not be suitable for all audiences and an explanation is given next
		to the rating. We have no higher rating than H, so it encompasses all
		content beyond G. We may assign a rating of H to a show for any number of
		reasons, including that it might be a little scary, confusing, or boring for
		young children.
	</p>

	<p>
		Over the years, we have entertained thousands of people from all over
		Nebraska, the United States, and abroad. The number of complaints we have
		received for content of our productions amounts to something on the order of
		one one-hundredth of one percent of all audience members. All this to say
		that we choose shows that we believe all our patrons will be in some way
		delighted to experience, and we haven’t missed the mark yet.
	</p>

	{#if productions.length > 0}
		<ul>
			{#each productions as production}
				<li>
					{production.title}
					&mdash;
					{production.rating}
					{#if production.rating_explanation}
						<div class="p-2 my-2 bg-grey-200 text-grey-600 max-w-2xl">
							{production.rating_explanation}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
