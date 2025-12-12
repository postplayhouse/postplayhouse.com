<script lang="ts" module>
	import z from "zod"

	const guaranteedOpeningSchema = z.array(
		z.looseObject({
			opening: z.iso.date(),
		}),
	)

	function assertProdsHaveOpenings<P>(
		productions: P[],
	): asserts productions is (P & { opening: string })[] {
		guaranteedOpeningSchema.parse(productions)
	}

	function assertedProdsHaveOpenings<P extends Production>(productions: P[]) {
		assertProdsHaveOpenings(productions)
		return productions
	}
</script>

<script lang="ts">
	import SeasonImage from "$components/SeasonImage.svelte"
	import OpeningBase from "$components/Openings/OpeningsBase.svelte"

	type Props = {
		season: Date.Year
		productions?: Production[]
		/** YYYY-MM-DD : Use this to view the component's state on a given date*/
		debugTodayString?: `${number}-${number}-${number}`
	}

	let { productions = [], season, debugTodayString }: Props = $props()
	let rotations = ["-rotate-2", "rotate-3", "rotate-2", "-rotate-2", "rotate-2"]
</script>

<OpeningBase
	{season}
	productions={assertedProdsHaveOpenings(productions)}
	{debugTodayString}
>
	{#snippet seasonArtworkImage()}
		<ul
			class="-m-4 flex list-none flex-wrap items-center justify-center gap-2 bg-green-200 p-6 *:max-w-96 sm:rounded-sm sm:*:max-w-60 dark:bg-transparent"
		>
			{#each productions as production, index}
				<li
					class="block overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 dark:bg-gray-300 dark:shadow-black/20 {rotations[
						index % rotations.length
					]}"
				>
					<SeasonImage
						class="max-w-full rounded-[10%] bg-white p-2 mix-blend-multiply"
						imageFile={production.image}
						{season}
						alt="Show Logo for {production.title}"
					></SeasonImage>
				</li>
			{/each}
		</ul>
	{/snippet}
</OpeningBase>
