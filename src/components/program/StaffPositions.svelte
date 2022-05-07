<script lang="ts" context="module">
  import unique from "lodash/uniq.js"
  import diff from "lodash/difference.js"
  import type { Person } from "../../models/Person"
  import { concat } from "lodash"

  const sortedPositions = [
    "Producing Artistic Director",
    "Artistic Director",
    "Development Director",
    "Accountant",
    "Season Stage Manager",
    "Season Assistant Stage Manager",
    "Assistant Stage Manager",
    "Season Technical Director",
    "Build & Run Crew",
    "Season Scenic Designer",
    "Paint Charge",
    "Season Costume Designer",
    "Stitcher/Wardrobe",
    "Box Office Manager",
    "Box Office Staff",
    "Remote Box Office Staff",
    "Box Office IT",
    "Marketing Designer",
    "General IT",
  ]
</script>

<script lang="ts">
  export let people: Person[]

  const positionNames = unique(people.flatMap((x) => x.staffPositions))
  const unknownPositions = diff(positionNames, unique(sortedPositions))

  const peopleByPosition = sortedPositions
    .concat(unknownPositions)
    .map((pos) => ({
      position: pos,
      people: people
        .filter((person) => person.staffPositions.includes(pos))
        .map((person) => person.name),
    }))
    .filter(({ people }) => people.length > 0)
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
  {#each peopleByPosition as { position, people }}
    <li class="w-full flex overflow-hidden">
      <span>{position.replace(/Assistant/, "Asst.")}</span>

      <span class="shrink-0 grow basis-4 relative">
        <span class="block absolute top-0 left-0"
          >..............................................................</span
        >
      </span>

      <span class="text-right [max-width:200px]">
        {#each people.join(",\n").split("\n") as person}
          <span class="whitespace-nowrap bg-white inline-block relative"
            >{person}</span
          ><span class="bg-white inline-block"> </span>
        {/each}
      </span>
    </li>
  {/each}
</ul>
