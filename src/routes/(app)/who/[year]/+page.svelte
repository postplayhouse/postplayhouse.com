<script lang="ts">
	import { toPerson } from "$models/Person"
	import Bio from "$components/Bio.svelte"
	import {
		sortPeople,
		groupPeople,
		sortBoardMembers,
		isOnlyActing,
	} from "$helpers"

	let { data } = $props()
	const { site, year, people: people_ } = data

	const shouldFilterActors =
		site.season.toString() === year && site.castingComplete === false

	const people = sortPeople(people_).filter((person) => {
		return shouldFilterActors ? !isOnlyActing(person) : true
	})

	const groupedPeople = groupPeople(people, "Board", "Additional")
	const generalGroupName = shouldFilterActors
		? "Crew and Staff"
		: "Cast, Musicians, Crew, and Staff"

	const groupNames = ["rest", "Additional", "Board"] as const

	groupedPeople["Board"] = sortBoardMembers(groupedPeople["Board"])
</script>

<h1 class="h1 mb-8">Summer {year} Biographies</h1>

{#if year === "2020"}
	<p>
		<a href="/news/2020-03-25-season-cancelled" class="link-green">
			Our 2020 Season was sadly cancelled.
		</a>
		Preserved here are the bios of the people we were really looking forward to working
		with.
	</p>
{/if}

{#if year === "2021"}
	<p>
		<a href="/news/2021-03-15-cancelling-2021-season/" class="link-green">
			Our 2021 Season was sadly cancelled.
		</a>
		These few bios reflect the team that were on board and ready, but we cancelled
		before auditions, so no actors were cast.
	</p>
{/if}

{#each groupNames as groupName}
	{#if groupedPeople[groupName].length}
		<h2
			id={groupName.toLowerCase().replace(/[^a-z]/g, "-")}
			class="h2 top-0 mb-4 bg-white sm:sticky dark:bg-[#0f110f]"
		>
			{groupName === "rest" ? generalGroupName : groupName}
		</h2>
		{#each groupedPeople[groupName] as person}
			<Bio person={toPerson(person)} hideProductionRoles={shouldFilterActors} />
		{/each}
	{/if}
{/each}
