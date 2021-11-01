<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"

  export const load: Load = async (obj) => {
    // the `year` parameter is available because
    // this file is called [year].svelte
    const res = await obj.fetch(`data/people.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { props: { seasons: data.seasons } }
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
  {#each years as year}
    <li><a href="{`/who/${year}`}">{year}</a></li>
  {/each}
</ul>
