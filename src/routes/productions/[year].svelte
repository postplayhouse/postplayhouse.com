<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  import site from "../../data/site"

  export const load: Load = async (obj) => {
    const res = await obj.fetch(`/data/productions/${obj.params["year"]}.json`)
    const data = await res.json()

    if (res.status === 200) {
      return {
        props: {
          productions: data.productions,
          year: parseInt(obj.params["year"]),
        },
      }
    } else {
      return {
        status: res.status,
        error: new Error(
          `could not fetch /data/productions/${obj.params["year"]}.json`,
        ),
      }
    }
  }
</script>

<script lang="ts">
  import Production from "$components/Production.svelte"
  import MaybeImage from "$components/MaybeImage.svelte"
  import TicketsButton from "$components/TicketsButton.svelte"
  export let productions
  export let year

  const seasonImg = `/images/${year}/full-season.jpg`
</script>

<h1 class="h1">Summer {year} Productions</h1>

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

<MaybeImage src="{[seasonImg]}" alt="All {year} productions" />

{#if site.ticketsAvailable && site.season === year}
  <div class="my-4 text-center">
    Tickets are on sale now!
    <br />
    <br />
    <TicketsButton />
  </div>
{/if}

{#if productions.length > 0}
  {#each productions as production}
    <Production production="{production}" season="{year}" />
  {/each}
{:else}
  <h2 class="text-xl text-center">
    There is no historical production info for {year}
  </h2>
{/if}
