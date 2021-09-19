<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"

  export const load: Load = async (obj) => {
    const res = await obj.fetch(`/data/productions.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { props: { site: data.site, seasons: data.seasons } }
    } else {
      return { status: res.status, error: new Error(data.message) }
    }
  }
</script>

<script lang="ts">
  export let seasons

  const years = Object.keys(seasons)
</script>

<ul>
  {#each years as season}
    <li><a href="{`/productions/${season}`}">{season}</a></li>
  {/each}
</ul>
