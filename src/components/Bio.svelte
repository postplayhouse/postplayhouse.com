<script>
  import Markdown from "./Markdown.svelte"
  import { toPerson } from "../models/Person"
  export let person
  export let toPersonFn

  $: localPerson = (toPersonFn || toPerson)(person)
</script>

<div class="clearfix mb-8">
  {#if localPerson.image}
    <img
      class="block max-w-md mb-4 md:mr-4 md:float-left md:w-1/2"
      src={localPerson.image}
      alt="portrait of {localPerson.name}" />
  {/if}

  <div class="text-4xl leading-none">{localPerson.name}</div>

  {#if localPerson.location}
    <div class="text-xl text-green-700">{localPerson.location}</div>
  {/if}

  <ul class="list-none font-thin mb-2">
    {#if localPerson.positions.length}
      <!-- Always use localPerson.positions by itself if it exists -->
      {#each localPerson.positions as position}
        <li>
          {@html position.replace('---', '&mdash;')}
        </li>
      {/each}
    {:else}
      {#each localPerson.staffPositions as position}
        <li>
          {@html position.replace('---', '&mdash;')}
        </li>
      {/each}

      {#each localPerson.productionPositions as positionObj}
        <li>
          {positionObj.productionName} &mdash; {positionObj.positions.join(', ')}
        </li>
      {/each}

      {#each localPerson.roles as positionObj}
        <li>
          {positionObj.productionName}
          {#if positionObj.productionName !== 'Season'}&mdash;{/if}
          {positionObj.positions.join(', ')}
        </li>
      {/each}
    {/if}
  </ul>

  <Markdown source={localPerson.bio} />
</div>