<script context="module" lang="ts">
	import type { Person } from "$models/Person"

	/**
	 * Grabbed this from imagetools-core/dist/types.d.ts
	 */
	interface Picture {
		/**
		 * Key is format. Value is srcset.
		 */
		sources: Record<string, string>
		img: {
			src: string
			w: number
			h: number
		}
	}

	type Props = {
		hideProductionRoles?: boolean
		person: Pick<
			Person,
			| "productionPositions"
			| "image"
			| "name"
			| "location"
			| "positions"
			| "staffPositions"
			| "roles"
			| "bio"
		> &
			Partial<Pick<Person, "slug">>
	}

	const imageModules = import.meta.glob<{ default: Picture }>(
		`/src/images/people/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
		{
			eager: true,
			query: {
				enhanced: true,
				w: "450;900",
				withoutEnlargement: true,
			},
		},
	)

	const dict = Object.entries(imageModules)

	function findImageInBio(partialImagePath: string | undefined) {
		if (!partialImagePath) return

		const possibleModule = dict.find(([path]) =>
			path.includes(partialImagePath),
		)?.[1]

		return possibleModule?.default
	}
</script>

<script lang="ts">
	import uniq from "lodash-es/uniq.js"
	import flatten from "lodash-es/flatten.js"
	import Markdown from "./Markdown.svelte"

	let { hideProductionRoles, person }: Props = $props()

	// Pivot productionName and positions for localPerson.productionPositions
	const productionPositions: Array<{
		position: string
		productionNames: string[]
	}> = uniq(flatten(person.productionPositions.map((x) => x.positions))).map(
		(position) => ({
			position,
			productionNames: person.productionPositions
				.filter((po) => po.positions.includes(position))
				.map((po) => po.productionName),
		}),
	)

	const enhancedImage = $derived(
		person && (findImageInBio(person.image) as (string & Picture) | undefined),
	)
	const image = $derived(person && person.image)
</script>

<div class="flow-root mb-8" id="{person.slug}">
	{#if enhancedImage}
		<enhanced:img
			class="block w-full max-w-md mb-4 md:mr-4 md:float-left md:w-1/2 border"
			src="{enhancedImage}"
			alt="portrait of {person.name}"
		></enhanced:img>
	{:else if image}
		<img
			class="block w-full max-w-md mb-4 md:mr-4 md:float-left md:w-1/2 border"
			src="{image}"
			alt="portrait of {person.name}"
		/>
	{:else}
		<div
			class="flex w-full max-w-md mb-4 md:mr-4 md:float-left md:w-1/2 min-h-64 border-4 border-neutral-300 items-center justify-center"
		>
			({person.name} not pictured)
		</div>
	{/if}

	<div class="text-2xl leading-none">{person.name}</div>

	{#if person.location}
		<div class="text-lg text-green-700">{person.location}</div>
	{/if}

	<div class="flow-root font-thin mb-2">
		<ul class="list-none pl-0">
			{#if person.positions.length}
				<!-- Always use localPerson.positions by itself if it exists -->
				{#each person.positions as position}
					<li class="pl-4 -text-indent-4">
						{@html position.replace("---", "&mdash;")}
					</li>
				{/each}
			{:else}
				{#each person.staffPositions as position}
					<li class="pl-4 -text-indent-4">
						{@html position.replace("---", "&mdash;")}
					</li>
				{/each}

				{#each productionPositions as positionObj}
					<li class="pl-4 -text-indent-4">
						{positionObj.position}
						&mdash;
						{positionObj.productionNames.join(", ")}
					</li>
				{/each}

				{#if person.roles && !hideProductionRoles}
					{#each person.roles as positionObj}
						<li class="pl-4 -text-indent-4">
							{positionObj.productionName}
							&mdash;
							{#if typeof positionObj.positions === "string"}
								<!-- 2019 and earlier -->
								{positionObj.positions}
							{:else}
								<!-- 2020 and later -->
								{positionObj.positions.join(", ")}
							{/if}
						</li>
					{/each}
				{/if}
			{/if}
		</ul>
	</div>

	<Markdown source="{person.bio}" />
</div>
