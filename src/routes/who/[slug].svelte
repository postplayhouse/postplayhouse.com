<script context="module">
  export async function preload({ params, query }) {
    const res = await this.fetch(`data/people/${params.slug}.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { site: data.site, people: data.people, slug: params.slug }
    } else {
      this.error(res.status, data.message)
    }
  }
</script>

<script>
  import Bio from "../../components/Bio.svelte"
  import { sortPeople, personIsOnlyInGroup, groupPeople } from "../../helpers"
  export let site
  export let slug
  export let people

  const shouldFilterActors =
    site.season.toString() === slug && site.castingComplete === false

  people = sortPeople(people).filter((person) => {
    return shouldFilterActors ? !personIsOnlyInGroup(person, "cast") : true
  })
  const groupedPeople = groupPeople(people, "Board", "Additional")
  const generalGroupName = shouldFilterActors
    ? "Crew and Staff"
    : "Cast, Musicians, Crew, and Staff"
</script>

{#each ['rest', 'Board', 'Additional'] as groupName}
  {#if slug === '2020'}
    <p>
      <a href="/news/2020-03-25-season-cancelled" class="link-green">
        Our 2020 Season was sadly cancelled.
      </a>
      Preserved here are the people we were really looking forward to working
      with.
    </p>
  {/if}

  {#if groupedPeople[groupName].length}
    <h2 class="h2 sm:sticky top-0 bg-white mb-4">
      {groupName === 'rest' ? generalGroupName : groupName}
    </h2>
    {#each groupedPeople[groupName] as person}
      <Bio person="{person}" />
    {/each}
  {/if}
{/each}
