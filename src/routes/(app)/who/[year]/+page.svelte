<script lang="ts">
	import { toPerson } from "$models/Person"
	import Bio from "$components/Bio.svelte"
	import {
		sortPeople,
		personIsOnlyInGroup,
		groupPeople,
		sortBoardMembers,
	} from "$helpers"

	let { data } = $props()
	const { site, year, people: people_ } = data

	const shouldFilterActors =
		site.season.toString() === year && site.castingComplete === false

	const people = sortPeople(people_).filter((person) => {
		return shouldFilterActors ? !personIsOnlyInGroup(person, "cast") : true
	})
	const groupedPeople = groupPeople(people, "Board", "Additional")
	const generalGroupName = shouldFilterActors
		? "Crew and Staff"
		: "Cast, Musicians, Crew, and Staff"

	const groupNames = ["rest", "Additional", "Board"] as const

	groupedPeople["Board"] = sortBoardMembers(groupedPeople["Board"])
</script>

{#if year === "2020"}
	<p>
		<a href="/news/2020-03-25-season-cancelled" class="link-green">
			Our 2020 Season was sadly cancelled.
		</a>
		Preserved here are the bios of the people we were really looking forward to working
		with.
	</p>
{/if}

{#each groupNames as groupName}
	{#if groupedPeople[groupName].length}
		<h2
			id="{groupName.toLowerCase().replace(/[^a-z]/g, '-')}"
			class="h2 sm:sticky top-0 bg-white dark:bg-[#0f110f] mb-4"
		>
			{groupName === "rest" ? generalGroupName : groupName}
		</h2>
		{#each groupedPeople[groupName] as person}
			<Bio
				person="{toPerson(person)}"
				hideProductionRoles="{shouldFilterActors}"
			/>
		{/each}
	{/if}
{/each}
