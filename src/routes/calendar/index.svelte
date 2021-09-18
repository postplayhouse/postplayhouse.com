<script lang="ts" context="module">
  import site from "../../data/site"
  export const year = site.season

  export async function load(obj) {
    const res = await obj.fetch(`/data/productions/${year}.json`)
    const data = await res.json()

    if (res.status === 200) {
      return {
        props: {
          productions: data.productions,
        },
      }
    } else {
      obj.error(res.status, data.message)
    }
  }
</script>

<script lang="ts">
  import Calendar from "../../components/Calendar/Calendar.svelte"
  export let productions: YearlyData["productions"][typeof year]
</script>

<h1 class="text-center font-uber text-4xl mb-2">{year} Season</h1>

<Calendar productions="{productions}" year="{year}" />
