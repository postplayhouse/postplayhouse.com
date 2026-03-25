<script lang="ts">
	import { toPerson } from "$models/Person"
	import Bio from "$components/Bio.svelte"
	import {
		sortPeople,
		groupPeople,
		sortBoardMembers,
		isOnlyActing,
	} from "$helpers"
	import { getPeople } from "$data/people.remote.js"
	import { page } from "$app/state"
	import { yearStringToNumber } from "$data/validation.js"
	import * as site from "$data/site"

	let year = $derived(yearStringToNumber.parse(page.params.year))
	let { people: people_ } = $derived(await getPeople(year))

	let shouldFilterActors = $derived(
		site.season === year && site.castingComplete === false,
	)

	let people = $derived(
		sortPeople(people_).filter((person) => {
			return shouldFilterActors ? !isOnlyActing(person) : true
		}),
	)

	let groupedPeople = $derived.by(() => {
		const gp = groupPeople(people, "Board", "Additional")
		gp["Board"] = sortBoardMembers(gp["Board"])
		return gp
	})

	let generalGroupName = $derived(
		shouldFilterActors ? "Crew and Staff" : "Cast, Musicians, Crew, and Staff",
	)

	const groupNames = ["rest", "Additional", "Board"] as const
</script>

<h1 class="h1 mb-8">Summer {year} Biographies</h1>

{#if shouldFilterActors}
	<p class="mb-4 text-xl">
		<strong>Note:</strong> Casting for the {year} season is not yet complete.
	</p>
	<p class="mb-4 text-xl">
		Want to <a class="link-green" href="../{site.season - 1}"
			>see last season's bios</a
		>?
	</p>
{/if}

{#if year === 2020}
	<p>
		<a href="/news/2020-03-25-season-cancelled" class="link-green">
			Our 2020 Season was sadly cancelled.
		</a>
		Preserved here are the bios of the people we were really looking forward to working
		with.
	</p>
{/if}

{#if year === 2021}
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
