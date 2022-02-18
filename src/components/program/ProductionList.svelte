<script lang="ts" context="module">
  import unique from "lodash/uniq.js"
  import diff from "lodash/difference.js"
  import type { Person } from "../../models/Person"

  const sortedPositions = [
    "Director",
    "Choreographer",
    "Music Director",
    "Production Stage Manager",
    "Lighting Designer",
    "Sound Designer",
    "Costume Designer",
    "Scenic Designer",
    "Technical Director",
    "Rehearsal Stage Manager",
    "Assistant Stage Manager",
    "Backstage Manager",
    "Calling Stage Manager",
    "Master Electrician",
    "Paint Charge",
    "Costume Shop Manager",
    "Stitcher",
    "Props Master",
    "Sound Mix Engineer",
  ]

  const sortedPit = [
    "First Keys/Conductor",
    "Second Keys",
    "Third Keys",
    "Drummer",
  ]
</script>

<script lang="ts">
  export let people: Person[]
  export let production: Production

  function positionIsForProduction(position: Person["productionPositions"][1]) {
    // At the time of writing this, I am not sure whether productionName
    // is meant to be the title or short_title, hence I am just using both
    return [production.title, production.short_title].includes(
      position.productionName,
    )
  }

  const allSortedPositions = [...sortedPositions, ...sortedPit]
  const positionNames = unique(
    people.flatMap((x) =>
      x.productionPositions
        .filter(positionIsForProduction)
        .flatMap((y) => y.positions),
    ),
  )
  const unknownPositions = diff(positionNames, unique(allSortedPositions))
</script>

{#if unknownPositions.length > 0}
  <div class="my-4">
    <p>
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

<h4 class="production-positions-heading">Production Staff</h4>
<ul class="production-positions people-list">
  {#each sortedPositions as position}
    {#each people as person}
      {#each person.productionPositions as personPosition}
        {#if positionIsForProduction(personPosition)}
          {#if personPosition.positions.includes(position)}
            <li>
              <span class="position">{position}</span>
              <span class="separator"></span>
              <span class="fulfiller">{person.name}</span>
            </li>
          {/if}
        {/if}
      {/each}
    {/each}
  {/each}
</ul>

<h4 class="band-positions-heading">Band</h4>
<ul class="band-positions people-list">
  {#each sortedPit as position}
    {#each people as person}
      {#each person.productionPositions as personPosition}
        {#if positionIsForProduction(personPosition)}
          {#if personPosition.positions.includes(position)}
            <li>
              <span class="position">{position}</span>
              <span class="separator"></span>
              <span class="fulfiller">{person.name}</span>
            </li>
          {/if}
        {/if}
      {/each}
    {/each}
  {/each}
</ul>

<style>
  .people-list {
    max-width: 400px;
    list-style: none;
  }

  .people-list li {
    width: 100%;
    display: flex;
  }

  li .separator {
    flex-basis: 3em;
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

  li .fulfiller {
    text-align: right;
  }

  li .fulfiller {
    white-space: nowrap;
  }
</style>
