<script lang="ts" context="module">
  export async function load(obj) {
    // the `slug` parameter is available because
    // this file is called [slug].svelte
    const res = await obj.fetch(`data/productions.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { site: data.site, seasons: data.seasons }
    } else {
      obj.error(res.status, data.message)
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
