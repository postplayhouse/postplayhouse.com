<script lang="ts" context="module">
  export async function preload({ params, query }) {
    const res = await this.fetch(`data/productions/${params.slug}.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { productions: data.productions, year: parseInt(params.slug) }
    } else {
      this.error(res.status, data.message)
    }
  }
</script>

<script lang="ts">
  import Calendar from "../../components/Calendar/Calendar.svelte"
  export let productions: YearlyData["productions"][Year]
  export let year: Year

  const hasCalendar = !!productions?.find((prod) => prod.dates)
</script>

<h1 class="text-center font-uber text-4xl">{year} Season</h1>

{#if year === 2020}
  <h3 class="h3 text-center">
    The 2020 Season was cancelled before it began due to COVID-19.
  </h3>
  <p class="text-xl text-center mb-4">
    The calendar is reproduced below as the season was originally scheduled.
  </p>
{/if}

{#if hasCalendar}
  <Calendar productions="{productions}" year="{year}" />
{:else}
  <h2>There is no historical calendar for {year}</h2>
{/if}
