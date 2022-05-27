<script lang="ts">
  import { fade } from "svelte/transition"
  import { createEventDispatcher } from "svelte"
  import { fast } from "./helpers"

  const INT = fast ? 500 : 5000

  const dispatch = createEventDispatcher()

  function eventDone() {
    dispatch("done")
  }
  const sections = [
    { title: "$200,000+", names: ["Shuttered Venue Operators Grant"] },
    {
      title: "$10,000+",
      names: ["Chadron State College", "Nebraska Arts Council"],
    },
    {
      title: "$5,000+",
      names: [
        "Big Bat's, LLC",
        "Caterpillar Foundation",
        "Footprints",
        "Lee & Elizabeth Fritzler",
        "Todd Gaswick",
        "Tim Hindman Family",
        "Security First Bank",
        "Susan Sehnert Stuart, in Honor of Walt and Jean Sehnert",
        "Linda and Jon Steven Wiley",
      ],
    },
    {
      title: "$2,500+",
      names: [
        "Darold Newblom Foundation",
        "Walmart Foundation",
        "Janet E Williams",
        "Bertram and Patricia Witham Foundation",
      ],
    },
    {
      title: "$1,000+",
      names: [
        "David Bauerkemper",
        "Steve Cleveland",
        "Helen Kent",
        "Martin Drug & Mercantile",
        "Janelle Visser",
      ],
    },
  ]
  const slides = sections.flatMap((s) =>
    s.names.map((t) => ({ title: s.title, content: t })),
  )

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
</script>

{#each slides as slide, i}
  {#if i === current}
    <article class="absolute inset-0 flex flex-col">
      <header
        class="font-uber [font-size:5vw] text-center bg-green-700 text-white"
      >
        Annual Fund Donations
        <div class="bg-green-100 text-black">
          {slide.title}
        </div>
      </header>

      <div class="grow relative" transition:fade>
        <div
          class="absolute inset-0 flex justify-center items-center [font-size:5vw] font-bold text-center"
        >
          {slide.content}
        </div>
      </div>
    </article>
  {/if}
{/each}
