<script lang="ts">
  import uniq from "lodash/uniq.js"
  import flatten from "lodash/flatten.js"
  import Markdown from "./Markdown.svelte"
  import MaybeImage from "./MaybeImage.svelte"
  import { toPerson } from "../models/Person"

  export let person: YamlPerson
  export let toPersonFn = toPerson

  $: localPerson = toPersonFn(person)

  let productionPositions: Array<{
    position: string
    productionNames: string[]
  }> = []

  // Pivot prductionName and positions for localPerson.productionPositions
  $: {
    productionPositions = uniq(
      flatten(localPerson.productionPositions.map((x) => x.positions)),
    ).map((position) => ({
      position,
      productionNames: localPerson.productionPositions
        .filter((po) => po.positions.includes(position))
        .map((po) => po.productionName),
    }))
  }

  const optimizedVersion = (str) => "/g" + str.split(".").join("-800.")
</script>

<div class="flow-root mb-8">
  {#if localPerson.image}
    <MaybeImage
      class="block w-full max-w-md mb-4 md:pr-4 md:float-left md:w-1/2"
      src="{[optimizedVersion(localPerson.image), localPerson.image]}"
      alt="portrait of {localPerson.name}"
    />
  {/if}

  <div class="text-2xl leading-none">{localPerson.name}</div>

  {#if localPerson.location}
    <div class="text-lg text-green-700">{localPerson.location}</div>
  {/if}

  <ul
    class="list-none font-thin mb-2 pl-0 {localPerson.image
      ? 'sm:float-left sm:w-1/2'
      : ''}"
  >
    {#if localPerson.positions.length}
      <!-- Always use localPerson.positions by itself if it exists -->
      {#each localPerson.positions as position}
        <li class="pl-4 -text-indent-4">
          {@html position.replace("---", "&mdash;")}
        </li>
      {/each}
    {:else}
      {#each localPerson.staffPositions as position}
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

      {#each localPerson.roles as positionObj}
        <li class="pl-4 -text-indent-4">
          {positionObj.productionName}
          &mdash;
          {positionObj.positions.join(", ")}
        </li>
      {/each}
    {/if}
  </ul>

  <Markdown source="{localPerson.bio}" />
</div>
