<script lang="ts">
  import { diffDays, getDateFor, getToday } from "../helpers"

  export let productions: Production[] = []
  export let closingDate: string

  import Markdown from "./Markdown.svelte"
  import TicketsButton from "./TicketsButton.svelte"

  const today = getToday()

  const daysToClosing = diffDays(today, getDateFor(closingDate))
  const isBeforeClosing = daysToClosing > 0

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
