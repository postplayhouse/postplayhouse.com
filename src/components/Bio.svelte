<script lang="ts">
  import uniq from "lodash/uniq.js"
  import flatten from "lodash/flatten.js"
  import Markdown from "./Markdown.svelte"
  import MaybeImage from "./MaybeImage.svelte"
  import type { Person } from "../models/Person"

  export let person: Pick<
    Person,
    | "productionPositions"
    | "image"
    | "name"
    | "location"
    | "positions"
    | "staffPositions"
    | "roles"
    | "bio"
  >

  // Pivot prductionName and positions for localPerson.productionPositions
  let productionPositions: Array<{
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

  const optimizedVersion = (str: string) => "/g" + str.split(".").join("-800.")
</script>

<div class="flow-root mb-8">
  {#if person.image}
    <MaybeImage
      class="block w-full max-w-md mb-4 md:pr-4 md:float-left md:w-1/2"
      src="{[optimizedVersion(person.image), person.image]}"
      alt="portrait of {person.name}"
    />
  {/if}

  <div class="text-2xl leading-none">{person.name}</div>

  {#if person.location}
    <div class="text-lg text-green-700">{person.location}</div>
  {/if}

  <ul
    class="list-none font-thin mb-2 pl-0 {person.image
      ? 'sm:float-left sm:w-1/2'
      : ''}"
  >
    {#if person.positions.length}
      <!-- Always use localPerson.positions by itself if it exists -->
      {#each person.positions as position}
        <li class="pl-4 -text-indent-4">
          {@html position.replace("---", "&mdash;")}
        </li>
      {/each}
    {:else}
      {#each person.staffPositions as position}
        <li class="pl-4 -text-indent-4">
          {@html position.replace("---", "&mdash;")}
        </li>
      {/each}

      {#each productionPositions as positionObj}
        <li class="pl-4 -text-indent-4">
          {positionObj.position}
          &mdash;
          {positionObj.productionNames.join(", ")}
        </li>
      {/each}

      {#each person.roles as positionObj}
        <li class="pl-4 -text-indent-4">
          {positionObj.productionName}
          &mdash;
          {positionObj.positions.join(", ")}
        </li>
      {/each}
    {/if}
  </ul>

  <Markdown source="{person.bio}" />
</div>
