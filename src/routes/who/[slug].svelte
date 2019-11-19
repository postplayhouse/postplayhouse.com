<script context="module">
  export async function preload({ params, query }) {
    const res = await this.fetch(`who/${params.slug}.json`)
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
  import { sortPeople, personIsOnlyInGroup } from "../../helpers"
  export let site
  export let slug
  export let people

  const shouldFilterActors =
    site.season.toString() === slug && site.castingComplete === false

  people = sortPeople(people).filter((person) => {
    return shouldFilterActors ? !personIsOnlyInGroup(person, "cast") : true
  })
</script>

{#each people as person}
  <Bio {person} />
{/each}
<!-- {%- assign board = site.data.people[page.bio_year] -%}

{%- assign people = '' | split: '' -%}
{%- assign people_grouped = site.data.people[page.bio_year] | group_by: 'sort_group' -%}

{%- for group in people_grouped -%}
  {%- assign sorted_group = group.items | sort_natural: 'last_name' -%}
  {%- assign people = people | concat: sorted_group -%}
{%- endfor -%}

<div class="bios-page">
  {%- include cast.html people=people -%}
  {%- include staff.html people=people -%}
  {%- include board.html people=board -%}
</div> -->
