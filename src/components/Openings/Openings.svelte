<script module lang="ts">
	export const closingDate = "2025-08-10" as const
</script>

<script lang="ts">
	import SeasonImage from "$components/SeasonImage.svelte"
	import OpeningBase from "$components/Openings/OpeningsBase.svelte"

	type Props = {
		productions?: Production[]
		/** YYYY-MM-DD : Use this to view the component's state on a given date*/
		debugTodayString?: `${number}-${number}-${number}`
	}

	let { productions, debugTodayString }: Props = $props()
</script>

<OpeningBase {productions} {debugTodayString} {closingDate}>
	{#snippet seasonArtworkImage()}
		<ul
			class="-m-4 flex list-none flex-wrap items-center justify-center gap-2 bg-green-200 p-6 sm:rounded dark:bg-transparent [&>*]:max-w-96 sm:[&>*]:max-w-60"
		>
			<li
				class="block -rotate-2 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:scale-100 dark:bg-neutral-300 dark:shadow-black/20"
			>
				<SeasonImage
					class="max-w-full mix-blend-multiply"
					imageFile="guys-n-dolls.jpg"
					season="2025"
					alt="Show Logo for guys-n-dolls"
				></SeasonImage>
			</li>
			<li
				class="block rotate-3 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:scale-100 dark:bg-neutral-300 dark:shadow-black/20"
			>
				<SeasonImage
					class="max-w-full mix-blend-multiply"
					imageFile="nunsense-jamboree.jpg"
					season="2025"
					alt="Show Logo for nunsense-jamboree"
				></SeasonImage>
			</li>
			<li
				class="md:rotate dark:scale-100-0 block rotate-2 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:bg-neutral-300 dark:shadow-black/20"
			>
				<SeasonImage
					class="max-w-full mix-blend-multiply"
					imageFile="newsies.jpg"
					season="2025"
					alt="Show Logo for newsies"
				></SeasonImage>
			</li>
			<li
				class="block -rotate-2 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:scale-100 dark:bg-neutral-300 dark:shadow-black/20"
			>
				<SeasonImage
					class="max-w-full mix-blend-multiply"
					imageFile="lucky-stiff.jpg"
					season="2025"
					alt="Show Logo for lucky-stiff"
				></SeasonImage>
			</li>
			<li
				class="block rotate-2 overflow-clip rounded-[10%] shadow-lg shadow-green-800/50 md:scale-105 dark:scale-100 dark:bg-neutral-300 dark:shadow-black/20"
			>
				<SeasonImage
					class="max-w-full mix-blend-multiply"
					imageFile="into-the-woods.jpg"
					season="2025"
					alt="Show Logo for into-the-woods"
				></SeasonImage>
			</li>
		</ul>
	{/snippet}
</OpeningBase>
