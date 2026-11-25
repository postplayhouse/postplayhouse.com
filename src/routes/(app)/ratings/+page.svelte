<script lang="ts">
	import * as site from "$data/site"

	let { data } = $props()
	const { productions } = $derived(data)
</script>

<div class="via-markdown">
	<p>
		At the Post Playhouse, we believe theatre is an experience to be enjoyed by
		audiences of all ages. Because every parent’s preferences and sensitivities
		are different, our show ratings are intended as general guidance rather than
		strict age restrictions.
	</p>

	<ul>
		<li><strong>G:</strong> Suitable for all ages and all audiences.</li>
		<li>
			<strong>PG:</strong> Suitable for most audiences. Productions may include some
			more mature themes that might require parental guidance. Guardians, consider
			researching this production’s specific content to determine if it is suitable
			for your child.
		</li>
		<li>
			<strong>PG-13:</strong> Material may be inappropriate for certain children
			under 13. This production may include more mature themes. Guardians, consider
			researching this production’s specific content to determine if it is suitable
			for your child.
		</li>
	</ul>

	{#if productions.length > 0}
		<h2>{site.season} Season Ratings</h2>
		<ul>
			{#each productions as production}
				<li>
					{production.title}
					&mdash;
					{production.rating}
					{#if production.rating_explanation}
						<div class="my-2 max-w-2xl bg-gray-200 p-2 text-gray-600">
							{production.rating_explanation}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
