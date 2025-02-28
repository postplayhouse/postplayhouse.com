<script lang="ts" module>
	import unique from "lodash-es/uniq.js"
	import diff from "lodash-es/difference.js"
	import type { Person } from "$models/Person"
</script>

<script lang="ts">
	type Props = {
		people: Person[]
		production: Production
	}

	let { people, production }: Props = $props()

	const peopleRoles = people.flatMap((x) =>
		x.roles.filter(roleIsForProduction).flatMap((r) => r.positions),
	)

	const sortedRoles = unique(
		(production.roles_sorting || []).concat(peopleRoles),
	)

	const unusedSortedRoles = diff(sortedRoles, peopleRoles)

	function roleIsForProduction(role: Person["roles"][1]) {
		// At the time of writing this, I am not sure whether productionName
		// is meant to be the title or short_title, hence I am just using both
		return [production.title, production.short_title].includes(
			role.productionName,
		)
	}

	let ensembleMembers: Person[] = []
	let rolesToList: Array<{ role: string; person: Person }> = []

	for (const role of sortedRoles) {
		for (const person of people) {
			for (const personRole of person.roles) {
				if (!roleIsForProduction(personRole)) continue
				if (!personRole.positions.includes(role)) continue

				if (role === "Ensemble") ensembleMembers.push(person)
				else rolesToList.push({ role, person })
			}
		}
	}
</script>

{#if unusedSortedRoles.length > 0}
	<div>
		WARNING: There are unused sorting roles:
		{#each unusedSortedRoles as unusedSortedRole}
			<div>{unusedSortedRole}</div>
		{/each}
	</div>
{/if}

<h4 class="production-positions-heading">Cast</h4>
<ul class="cast-list people-list">
	{#each rolesToList as item}
		<li>
			<span class="position">{item.role}</span>
			<span class="separator"></span>
			<span class="fulfiller">{item.person.name}</span>
		</li>
	{/each}

	{#if ensembleMembers.length > 0}
		<li>
			<span class="role">Ensemble</span>
			<span class="separator"></span>
			<span class="actors">
				{#each ensembleMembers as member, i}
					<span class="actor">{member.name}</span>{i <
					ensembleMembers.length - 1
						? ", "
						: ""}
				{/each}
			</span>
		</li>
	{/if}
</ul>

<style>
	.people-list {
		max-width: 400px;
		list-style: none;
	}

	.people-list li {
		width: 100%;
		display: flex;
	}

	li .separator {
		flex-basis: 3em;
		flex-shrink: 0;
		flex-grow: 1;
		position: relative;
	}

	li .separator:after {
		content: "...............................................................................................................................................";
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		overflow: hidden;
		word-break: break-all;
		height: 1.5em;
	}

	li .actors,
	li .fulfiller {
		text-align: right;
	}

	li .actors .actor,
	li .fulfiller {
		white-space: nowrap;
	}
</style>
