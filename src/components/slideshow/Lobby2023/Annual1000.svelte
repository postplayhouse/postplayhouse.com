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
    {
      title: "$10,000+",
      names: [
        "Casey Peterson",
        "Chadron State College",
        "Security First Bank",
        "Anonymous (1)",
      ],
    },
    {
      title: "$6,000+",
      names: [
        "Footprints, Your Birkenstock Store",
        "Todd A. Gaswick at TAG Financial Solutions ",
        "Mobius Communications",
        "Susan Sehnert Stuart",
        "WESTCO",
      ],
    },
    {
      title: "$5,000+",
      names: [
        "Bill and Virginia Coffee Family Foundation",
        "Nebraska Arts Council",
      ],
    },
    {
      title: "$2,500+",
      names: ["Darold Newblom Foundation", "Linda and Jon Steven Wiley"],
    },
    {
      title: "$1,000+",
      names: [
        "H&R Block of Chadron",
        "Jack Isaacs",
        "Martin Drug & Mercantile",
        "Jeanine Mohr",
        "Phillips F & T Inc.",
        "Annie and Richard Sellman",
        "Cathy Soester",
        "Janelle Visser",
        "Walmart Foundation",
        "Bertram and Patricia Witham Foundation",
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
