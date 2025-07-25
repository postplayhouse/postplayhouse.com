<script lang="ts">
	import uniq from "lodash-es/uniq.js"
	import flatten from "lodash-es/flatten.js"
	import Markdown from "./Markdown.svelte"
	import type { Person } from "$models/Person"
	import PersonImage from "./PersonImage.svelte"

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
</script>

<div class="mb-8 flow-root" id={person.slug}>
	{#if person && person.image}
		<PersonImage
			class="mb-4 block w-full max-w-md border md:float-left md:mr-4 md:w-1/2"
			partialPath={person.image}
			alt="portrait of {person.name}"
		/>
	{:else}
		<div
			class="mb-4 flex min-h-64 w-full max-w-md items-center justify-center border-4 border-neutral-300 md:float-left md:mr-4 md:w-1/2"
		>
			({person.name} not pictured)
		</div>
	{/if}

	<div class="text-2xl leading-none">{person.name}</div>

	{#if person.location}
		<div class="text-lg text-green-700">{person.location}</div>
	{/if}

	<div class="mb-2 flow-root font-thin">
		<ul class="list-none pl-0">
			{#if person.positions.length}
				<!-- Always use localPerson.positions by itself if it exists -->
				{#each person.positions as position}
					<li class="pl-4 [text-indent:calc(var(--spacing)*-4)]">
						{@html position.replace("---", "&mdash;")}
					</li>
				{/each}
			{:else}
				{#each person.staffPositions as position}
					<li class="pl-4 [text-indent:calc(var(--spacing)*-4)]">
						{@html position.replace("---", "&mdash;")}
					</li>
				{/each}

				{#each productionPositions as positionObj}
					<li class="pl-4 [text-indent:calc(var(--spacing)*-4)]">
						{positionObj.position}
						&mdash;
						{positionObj.productionNames.join(", ")}
					</li>
				{/each}

				{#if person.roles && !hideProductionRoles}
					{#each person.roles as positionObj}
						<li class="pl-4 [text-indent:calc(var(--spacing)*-4)]">
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

	<Markdown source={person.bio} />
</div>
