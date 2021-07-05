<script lang="ts" context="module">
  export const year = 2020

  // export async function load(obj) {
  //   const res = await obj.fetch(`data/productions/${year}.json`)
  //   const data = await res.json()

  //   if (res.status === 200) {
  //     return { productions: data.productions }
  //   } else {
  //     obj.error(res.status, data.message)
  //   }
  // }
</script>

<script lang="ts">
  // import Calendar from "../../components/Calendar/Calendar.svelte"
  // export let productions: YearlyData['productions'][typeof year]
</script>

<h1 class="text-center font-uber text-4xl">{year} Season Cancelled</h1>
<h2 class="text-center font-uber text-3xl">
  <a href="/news/2020-03-25-season-cancelled" class="link-green">
    {year + 1}
    Season in planning
  </a>
</h2>

<!-- <Calendar productions="{productions}" year="{year}" /> -->
