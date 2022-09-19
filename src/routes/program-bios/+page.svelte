<script lang="ts" context="module">
  throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

  // import type { Load } from "@sveltejs/kit"
  // import { type Person, toPerson } from "../../models/Person"
  // import site from "../../data/site"
  // import { marked } from "marked"

  // marked.setOptions({ smartypants: true })

  // export const load: Load = async (obj) => {
  //   const peopleRes = await obj.fetch(`/data/people/${site.season}.json`)
  //   const peopleData = await peopleRes.json()
  //   if (peopleRes.status !== 200)
  //     return { status: 500, error: new Error(peopleData.message) }

  //   const productionsRes = await obj.fetch(
  //     `/data/productions/${site.season}.json`,
  //   )
  //   const productionsData = await productionsRes.json()
  //   if (productionsRes.status !== 200)
  //     return { status: 500, error: new Error(productionsData.message) }

  //   return {
  //     props: {
  //       people: peopleData.people,
  //       productions: productionsData.productions,
  //     },
  //   }
  // }
</script>

<script lang="ts">
  throw new Error("@migration task: Add data prop (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292707)");

  import CastList from "$components/program/CastList.svelte"
  import ProductionList from "$components/program/ProductionList.svelte"
  import { sortPeople, personIsInGroup, slugify } from "../../helpers"
  export let people: YamlPerson[]
  export let productions: Production[]

  const initialSort = sortPeople(people).map(toPerson)
  const additional = initialSort.filter((x) => personIsInGroup(x, "additional"))

  // Additional bios to the end
  const sortedPeople = [
    ...initialSort.filter((x) => !additional.includes(x)),
    ...additional,
  ]

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
    checked="{showUi}"
    on:change="{() => (showUi = !showUi)}"
  /> Show non-program UI in Bios (buttons/anchors)</label
>

<div class="my-4">
  <header>Jump to Bio</header>

  <ol class="md:[columns:3]">
    {#each sortedPeople.filter(notInBoard) as person}
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

<div>
  {#each productions as production}
    <h3 class="h3">{production.title}</h3>
    <ProductionList people="{sortedPeople}" production="{production}" />
    <CastList people="{sortedPeople}" production="{production}" />
  {/each}
</div>

<div class="helvetica my-8">
  {#each sortedPeople.filter(notInBoard) as person}
    <div class="my-8" id="{personSlug(person)}">
      {#if notInAdditional(person) && person.image}
        <img
          src="{person.image}"
          alt="{person.image ? '' : 'missing '}picture of {person.name}"
          class="max-w-sm max-h-96 m-auto"
        />
      {/if}

      <div class="m-auto max-w-2xl">
        <h3 class="text-2xl">{person.name}</h3>

        {#if person.location}
          {@html marked.parseInline(person.location)}
        {/if}

        {#if person.positions.length > 0}
          <p class="my-8">
            {#each person.positions as position}
              {@html position.replace(/---/g, "&mdash;")}<br />
            {/each}
          </p>
        {:else if person.productionPositions.length > 0 || person.roles.length > 0 || person.staffPositions.length > 0}
          <p class="my-8">
            {#each person.staffPositions as position}
              {@html position.replace(/---/g, "&mdash;")}<br />
            {/each}

            {#each person.productionPositions as position}
              {position.productionName} &mdash; {position.positions.join(
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
          {@html marked(
            person.programBio || "(no program bio actually exists)",
          )}
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

<div class="my-8 space-y-8">
  <h1 id="TheBoard" class="text-4xl">Board Headshots and Names</h1>

  {#each sortedPeople.filter(inBoard) as person}
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

<style>
  .helvetica {
    font-family: Helvetica !important;
  }
</style>
