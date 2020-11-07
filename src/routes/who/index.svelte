<script context="module">
  export async function preload({ params, query }) {
    // the `slug` parameter is available because
    // this file is called [slug].svelte
    const res = await this.fetch(`data/people.json`)
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
  const years = Object.keys(seasons)
</script>

<ul>
  {#each years as year}
    <li><a href="{`/who/${year}`}">{year}</a></li>
  {/each}
</ul>
