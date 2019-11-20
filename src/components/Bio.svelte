<script>
  import Markdown from "./Markdown.svelte"
  import { toPerson } from "../models/Person"
  export let person
  person = toPerson(person)
</script>

<div class="clearfix mb-8">
  {#if person.image}
    <img
      class="block max-w-md mb-4 md:mr-4 md:float-left md:w-1/2"
      src={person.image}
      alt="portrait of {person.name}" />
  {/if}

  <div class="text-4xl leading-none">{person.name}</div>

  <ul class="list-none font-thin mb-2">
    {#if person.positions.length}
      <!-- Always use person.positions by itself if it exists -->
      {#each person.positions as position}
        <li>
          {@html position.replace('---', '&mdash;')}
        </li>
      {/each}
    {:else}
      {#each person.staffPositions as position}
        <li>
          {@html position.replace('---', '&mdash;')}
        </li>
      {/each}

      {#each person.productionPositions as positionObj}
        <li>
          {positionObj.productionName} &mdash; {positionObj.positions.join(', ')}
        </li>
      {/each}

      {#each person.roles as positionObj}
        <li>
          {positionObj.productionName}
          {#if positionObj.productionName !== 'Season'}&mdash;{/if}
          {positionObj.positions.join(', ')}
        </li>
      {/each}
    {/if}
  </ul>

  <Markdown source={person.bio} />
</div>
