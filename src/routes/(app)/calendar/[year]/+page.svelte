<script lang="ts">
  import Calendar from "$components/Calendar/Calendar.svelte"

  import type { PageData } from "./$types"
  export let data: PageData

  const { productions, year } = data

  const hasCalendar = !!productions?.find((prod) => prod.dates)
</script>

<h1 class="text-center font-uber text-4xl mb-2">{year} Season</h1>

{#if year === 2020}
  <h3 class="h3 text-center">
    The 2020 Season was cancelled before it began due to COVID-19.
  </h3>
  <p class="text-xl text-center mb-4">
    The calendar is reproduced below as the season was originally scheduled.
  </p>
{/if}

{#if year === 2021}
  <h3 class="h3 text-center">The 2021 Season was cancelled due to COVID-19.</h3>
{/if}

{#if hasCalendar}
  <Calendar productions="{productions}" year="{year}" />
{:else}
  <h2 class="text-center">There is no historical calendar for {year}</h2>
{/if}
