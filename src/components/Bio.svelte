<script lang="ts">
	import uniq from "lodash-es/uniq.js"
	import flatten from "lodash-es/flatten.js"
	import Markdown from "./Markdown.svelte"
	import MaybeImage from "./MaybeImage.svelte"
	import type { Person } from "$models/Person"

	export let hideProductionRoles: boolean = false
	export let isSubmissionPreview = false

	export let person: Pick<
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

	// Pivot prductionName and positions for localPerson.productionPositions
	let productionPositions: Array<{
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

	const optimizedVersion = (str: string) => "/g" + str.split(".").join("-800.")
</script>

<div class="flow-root mb-8" id="{person.slug}">
	{#if person.image}
		{#key person.image}
			<MaybeImage
				key="{person.image}"
				class="block w-full max-w-md mb-4 md:mr-4 md:float-left md:w-1/2 border"
				src="{person.image.startsWith('data:')
					? [person.image]
					: [optimizedVersion(person.image), person.image]}"
				alt="portrait of {person.name}"
			/>
		{/key}
	{:else}
		<div
			class="flex w-full max-w-md mb-4 md:mr-4 md:float-left md:w-1/2 min-h-64 border-4 border-neutral-300 items-center justify-center"
		>
			{#if isSubmissionPreview}
				(Using old headshot)
			{:else}
				({person.name} not pictured)
			{/if}
		</div>
	{/if}

	<div class="text-2xl leading-none">{person.name}</div>

	{#if person.location}
		<div class="text-lg text-green-700">{person.location}</div>
	{/if}

	<div class="flow-root float-left font-thin mb-2">
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
							{positionObj.positions.join(", ")}
						</li>
					{/each}
				{/if}
			{/if}
		</ul>
	</div>
	<br />

	<Markdown source="{person.bio}" />
</div>
