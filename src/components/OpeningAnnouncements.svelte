<script lang="ts">
  export let productions: Production[] = []
  export let closingDate: string

  import Markdown from "./Markdown.svelte"
  import TicketsButton from "./TicketsButton.svelte"

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function getDateFor(str: string) {
    const [y, m, d] = str.split("-").map(Number) as [number, number, number]
    const showDay = new Date(today.getTime())
    showDay.setFullYear(y)
    showDay.setMonth(m - 1)
    showDay.setDate(d)
    return showDay
  }

  const daysToClosing = diffDays(today, getDateFor(closingDate))
  const isBeforeClosing = daysToClosing > 0

  function diffDays(a: Date, b: Date) {
    const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds

    return Math.round((b.getTime() - a.getTime()) / oneDay)
  }

  const enhancedProductions = productions.map((p) => ({
    ...p,
    daysUntilOpening: diffDays(today, getDateFor(p.opening)),
  }))

  const nextOpening = enhancedProductions
    .sort((a, b) => a.daysUntilOpening - b.daysUntilOpening)
    .find((p) => p.daysUntilOpening >= 0)
</script>

{#if nextOpening}
  <h3 class="h1 font-uber">
    {nextOpening.title} opens {nextOpening.daysUntilOpening > 0
      ? "this Friday"
      : "today"}!
  </h3>

  <div class="md:flex items-center my-8">
    <div class="shrink">
      <img
        src="{`/images/${today.getFullYear()}/${nextOpening.image}`}"
        alt="{nextOpening.title} logo"
      />
    </div>
    <div class="text-center md:text-left shrink-0">
      <Markdown source="{nextOpening.writers}" />
    </div>
  </div>

  <Markdown source="{nextOpening.description}" />

  <div class="flex justify-center m-4">
    <TicketsButton />
  </div>
{/if}

{#if daysToClosing < 30 && !nextOpening}
  <div class="my-12">
    <h3 class="h1">Hurry! Summer is almost over!</h3>
    <p class="h3 text-center">
      There are only {daysToClosing} days left before our final performance this
      year!
    </p>

    <div class="flex justify-center m-4">
      <TicketsButton />
    </div>
  </div>
{/if}

{#if productions.length > 0 && isBeforeClosing}
  <slot />
  <div class="flex justify-center m-4">
    <TicketsButton />
  </div>
{/if}
