<script lang="ts" context="module">
  import unique from "lodash/uniq.js"
  import diff from "lodash/difference.js"
  import type { Person } from "../../models/Person"

  const sortedPositions = [
    "Producing Artistic Director",
    "Artistic Director",
    "Production Stage Manager",
    "Assistant Stage Manager",
    "Season Costume Designer",
    "Stitcher",
    "Wardrobe",
    "Season Paint Charge",
    "Box Office Manager",
    "Box Office Staff",
    "Box Office IT",
    "Development Director",
    "Marketing Designer",
    "General IT",
    "Accountant",
  ]
</script>

<script lang="ts">
  export let people: Person[]

  function personHasStaffPositions(person: Person) {
    return person.staffPositions.length > 0
  }

  const positionNames = unique(people.flatMap((x) => x.staffPositions))
  const unknownPositions = diff(positionNames, unique(sortedPositions))
</script>

{#if unknownPositions.length > 0}
  <div class="my-4">
    <p class="bg-red-300 border border-red-600 px-2">
      WARNING: Unknown positions exist. These may not be sorted in a desireable
      way.
    </p>
    <ol>
      {#each unknownPositions as unknownPosition}
        <li>{unknownPosition}</li>
      {/each}
    </ol>
  </div>
{/if}

<h4 class="h3">Post Playhouse Season Staff</h4>
<ul class="max-w-[400px] list-none">
  {#each sortedPositions.concat(unknownPositions) as position}
    {#each people.filter(personHasStaffPositions) as person}
      {#each person.staffPositions as personPosition}
        {#if personPosition === position}
          <li class="w-full flex">
            <span>{position.replace(/Season /g, "")}</span>
            <span class="separator"></span>
            <span class="text-right whitespace-nowrap">{person.name}</span>
          </li>
        {/if}
      {/each}
    {/each}
  {/each}
</ul>

<style>
  li .separator {
    flex-basis: 1em;
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
</style>
