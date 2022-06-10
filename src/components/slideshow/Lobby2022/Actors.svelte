<script lang="ts">
  import { fade } from "svelte/transition"
  import { createEventDispatcher } from "svelte"
  import { toPerson } from "../../../models/Person"
  import { marked } from "marked"
  import { fast } from "./helpers"

  const INT = fast ? 3000 : 15000

  const dispatch = createEventDispatcher()

  function eventDone() {
    dispatch("done")
  }

  export let actors: YamlPerson[]

  const slides = actors.map(toPerson).filter((x) => x.lobbyDisplay === true)

  let current = 0

  function getNextIndex() {
    return (current + 1) % slides.length
  }

  function nextOrDone() {
    const nextInt = getNextIndex()
    if (nextInt > 0) {
      current = nextInt
      setTimeout(nextOrDone, INT)
    } else {
      eventDone()
    }
  }

  setTimeout(nextOrDone, INT)

  const optimizedVersion = (str: string | undefined) =>
    str && "/g" + str.split(".").join("-400.")
</script>

{#each slides as person, i}
  {#if i === current}
    <article class="absolute inset-0 flex flex-col">
      <header
        class="bg-green-300 text-left text-black p-4 font-sans [font-size:2.5vw] flex justify-between"
      >
        <p>
          These talented actors joined us after local auditions this summer.
        </p>
        <span>
          ({i + 1} of {slides.length} )
        </span>
      </header>

      <div class="grow relative p-8" transition:fade>
        <img
          src="{optimizedVersion(person.image)}"
          alt="actor"
          class="max-h-128 float-left mr-8 mb-8"
        />
        <div class="text-black [font-size:4vw] leading-none mb-2">
          {person.name}
          {#each person.roles as positionObj}
            <div class="[font-size:3vw] font-bold">
              {positionObj.productionName}:
              {positionObj.positions.join(", ")}
            </div>
          {/each}
        </div>

        <div class="[font-size:2.5vw]">
          {@html marked.parseInline(person.bio)}
        </div>
      </div>
    </article>
  {/if}
{/each}
