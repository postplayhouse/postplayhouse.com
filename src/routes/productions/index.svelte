<script context="module">
  export async function preload({ params, query }) {
    // the `slug` parameter is available because
    // this file is called [slug].svelte
    const res = await this.fetch(`data/productions.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { site: data.site, seasons: data.seasons }
    } else {
      this.error(res.status, data.message)
    }
  }
</script>

<script>
  export let site
  export let seasons

  const toInt = (s) => parseInt(s, 10)
  const years = Object.keys(seasons)
    .map(toInt)
    .filter((x) => x > 2018)
</script>

{#each years as season}
  <a href={`/productions/${season}`}>{season}</a>
  <br />
{/each}
