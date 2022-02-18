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
</script>

<div id="TheTop"></div>

<div class="my-4">
  <header>Bio Approved?</header>

  <div class="grid grid-cols-3">
    {#each personnel.filter(notInBoard) as person}
      <div class="approved-{person.bioApproved ?? 'false'}">
        <a class="link-green" href="#{personSlug(person)}">{person.name}</a>
      </div>
    {/each}
  </div>
</div>

<a href="#TheBoard" class="block link-green my-4">Jump to the Board</a>

<div class="lists-per-show">
  {#each productions as production}
    <h3>{production.title}</h3>
    <ProductionList people="{personnel}" production="{production}" />
    <CastList people="{personnel}" production="{production}" />
  {/each}
</div>

<div class="not-bios-page-wink-wink">
  {#each personnel.filter(notInBoard) as person}
    <div
      class="plain-bio bio-approved-{person.bioApproved ?? 'false'}"
      id="{personSlug(person)}"
    >
      {#if notInAdditional(person) && person.image}
        <img
          class="plain-bio-headshot"
          src="{person.image}"
          alt="{person.image ? '' : 'missing '}picture of {person.name}"
        />
      {/if}
      <div class="bio-unapproved-text">
        {person.firstName}'s bio or roles are not yet approved.
      </div>

      <div class="plain-bio-text">
        <h3 class="name">{person.name}</h3>

        {#if person.location}
          {@html marked.parseInline(person.location)}
        {/if}

        {#if person.positions.length > 0}
          <p class="positions">
            {#each person.positions as position}
              {@html position.replace(/---/g, "&mdash;")}<br />
            {/each}
          </p>
        {:else if person.productionPositions.length > 0 || person.roles.length > 0 || person.staffPositions.length > 0}
          <p class="positions">
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

        {@html marked(person.bio)}
      </div>

      <a class="link-green" href="#TheTop">Back to Top</a>
    </div>
  {/each}
</div>

<h1 id="TheBoard" style="font-size:3em;">Board Headshots and Names</h1>

{#each personnel.filter(inBoard) as person}
  <div class="plain-bio">
    {#if person.image}
      <img
        class="plain-bio-headshot"
        src="{person.image}"
        alt="{person.image ? '' : 'missing '}picture of {person.name}"
      />
    {/if}

    <div class="plain-bio-text">
      <span class="name">{person.name}</span>
    </div>
  </div>
{/each}

<style>
  .plain-bio {
    margin-bottom: 5em;
    font-size: 14px !important;
    font-family: Helvetica !important;
    line-height: 1.2;
  }
  .plain-bio-text .name {
    font-size: 20px;
    color: black;
  }
  .plain-bio p {
    margin: 0 !important;
  }
  .plain-bio a:visited,
  .plain-bio a:link {
    color: inherit !important;
  }
  .plain-bio-headshot {
    margin: auto;
    display: block;
    max-width: 900px;
  }
  .plain-bio-text {
    max-width: 600px;
    margin: auto;
    margin-top: 10px;
  }

  .bio-unapproved-text {
    display: none;
  }
  .bio-approved-false {
    opacity: 0.5;
  }
  .bio-approved-false .bio-unapproved-text {
    display: block;
    font-size: 1.5em;
    color: #911;
    text-align: center;
    padding: 1em;
  }

  br {
    line-height: 1;
  }

  .approved-true::before {
    color: green;
    content: "\2713";
    display: inline-block;
    width: 1em;
  }

  .approved-false::before {
    color: red;
    content: "x";
    display: inline-block;
    width: 1em;
  }

  .approved-true,
  .approved-false {
    margin-right: 1em;
    margin-left: 3em;
  }

  .plain-bio img,
  .bio img {
    margin: auto;
    display: block;
    max-width: 200px;
  }

  .plain-bio p.positions {
    margin: 12px auto !important;
  }
</style>
