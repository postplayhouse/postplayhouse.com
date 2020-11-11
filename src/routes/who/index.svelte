<script lang="ts" context="module">
  export async function preload({ params, query }) {
    // the `slug` parameter is available because
    // this file is called [slug].svelte
    const res = await this.fetch(`data/people.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { seasons: data.seasons }
    } else {
      this.error(res.status, data.message)
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
