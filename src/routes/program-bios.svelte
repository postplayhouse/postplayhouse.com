<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  import { Person, toPerson } from "../models/Person"
  import site from "../data/site"
  import { marked } from "marked"

  marked.setOptions({ smartypants: true })

  export const load: Load = async (obj) => {
    const peopleRes = await obj.fetch(`/data/people/${site.season}.json`)
    const peopleData = await peopleRes.json()
    if (peopleRes.status !== 200)
      return { status: 500, error: new Error(peopleData.message) }

    const productionsRes = await obj.fetch(
      `/data/productions/${site.season}.json`,
    )
    const productionsData = await productionsRes.json()
    if (productionsRes.status !== 200)
      return { status: 500, error: new Error(productionsData.message) }

    return {
      props: {
        people: peopleData.people,
        productions: productionsData.productions,
      },
    }
  }
</script>

<script lang="ts">
  import CastList from "$components/program/CastList.svelte"
  import ProductionList from "$components/program/ProductionList.svelte"
  import StaffPositions from "$components/program/StaffPositions.svelte"
  import { sortPeople, personIsInGroup, slugify } from "../helpers"
  import Error from "./__error.svelte"
  export let people: YamlPerson[]
  export let productions: Production[]

  const personnel = sortPeople(people).map(toPerson)

  function personSlug(person: Person) {
    return slugify(person.firstName + person.lastName)
  }

  function notInBoard(person: Person) {
    return !personIsInGroup(person, "board")
  }
  function inBoard(person: Person) {
    return personIsInGroup(person, "board")
  }
  function notInAdditional(person: Person) {
    return !personIsInGroup(person, "additional")
  }

  let showShortBio: Set<string> = new Set()

  function toggleShortBio(person: Person) {
    showShortBio.has(person.id)
      ? showShortBio.delete(person.id)
      : showShortBio.add(person.id)

    showShortBio = showShortBio
  }

  let showUi = true
</script>

<div id="TheTop"></div>

<label
  ><input
    type="checkbox"
    checked="{!showUi}"
    on:change="{() => (showUi = !showUi)}"
  /> View for copy/paste bios</label
>

{#if showUi}
  <div class="my-4">
    <header>Jump to Bio</header>

    <ol class="md:[columns:3]">
      {#each personnel.filter(notInBoard) as person}
        <li>
          <a class="link-green" href="#{personSlug(person)}">
            {person.name}
            {#if !person.bio}
              <span
                class="bg-yellow-200 rounded-full p-1 px-2 text-black whitespace-nowrap !no-underline"
              >
                no bio
              </span>
            {/if}
          </a>
        </li>
      {/each}
    </ol>
  </div>

  <a href="#TheBoard" class="block link-green my-4">Jump to the Board</a>

  <StaffPositions people="{personnel}" />

  {#each productions as production}
    <h3 class="h3">{production.title}</h3>
    <ProductionList people="{personnel}" production="{production}" />
    <CastList people="{personnel}" production="{production}" />
  {/each}
{/if}

{#if !showUi}
  <div class="bg-blue-200 border-2 border-blue-800 p-4 space-y-2">
    <p>
      When you copy/paste from here into Affinity Publisher, you'll want to
      first paste into a Rich Text editor then copy again before pasting into
      Affinity. This will preserve the italics of all the show titles.
    </p>
    <p>
      There is also an interesting issue where tons of non-breaking spaces may
      be added to the Rich Text, despite them not being present in the HTML.
      That can be solved by finding and replaceing the non-breaking spaces.
      You'll be able to find one by looking for odd line breaks.
    </p>
  </div>
{/if}

<div class="helvetica my-8">
  {#each personnel.filter(notInBoard) as person}
    <div class="my-8" id="{personSlug(person)}">
      {#if notInAdditional(person) && person.image && showUi}
        <img
          src="{person.image}"
          alt="{person.image ? '' : 'missing '}picture of {person.name}"
          class="max-w-sm max-h-96 m-auto"
        />
      {/if}

      <div class="m-auto max-w-2xl">
        <h3 class="text-2xl">{person.name}</h3>

        {#if person.location}
          {person.location}
        {/if}

        {#if person.positions.length > 0}
          <p class="my-8">
            {#each person.positions as position}
              {@html position.replace(/---/g, "&mdash;")}<br />
            {/each}
          </p>
        {:else if person.productionPositionsByPosition.length > 0 || person.roles.length > 0 || person.staffPositions.length > 0}
          <p class="my-8">
            {#each person.staffPositions as position}
              {@html position.replace(/---/g, "&mdash;")}<br />
            {/each}

            {#each person.productionPositionsByPosition as position}
              {position.position} &mdash; {position.productionNames.join(
                ", ",
              )}<br />
            {/each}

            {#each person.roles as role}
              {role.productionName} &mdash; {role.positions.join(", ")}<br />
            {/each}
          </p>
        {/if}

        {#if person.programBio && showUi}
          <button
            class="btn py-1 px-2"
            type="button"
            on:click="{() => toggleShortBio(person)}"
          >
            {#if showShortBio.has(person.id)}Show Long Bio{:else}Show Short Bio{/if}
          </button>
        {/if}

        {#if showShortBio.has(person.id)}
          {@html marked(person.programBio)}
        {:else}
          {@html marked(person.bio)}
        {/if}
      </div>
    </div>
    {#if showUi}
      <a class="link-green" href="#TheTop">Back to Top</a>
    {/if}
  {/each}
</div>

{#if showUi}
  <div class="my-8 space-y-8">
    <h1 id="TheBoard" class="text-4xl">Board Headshots and Names</h1>

    {#each personnel.filter(inBoard) as person}
      <div class="helvetica">
        {#if person.image}
          <img
            src="{person.image}"
            alt="{person.image ? '' : 'missing '}picture of {person.name}"
            class="max-w-sm max-h-96 m-auto"
          />
        {/if}

        <div class="text-center">
          <div>{person.name}</div>
          {#each person.positions as position}
            {position}
          {/each}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .helvetica {
    font-family: Helvetica !important;
  }
</style>
