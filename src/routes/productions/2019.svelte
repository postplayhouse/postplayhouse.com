<script context="module">
  export async function preload({ params, query }) {
    const res = await this.fetch(`productions/2019.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { site: data.site, productions: data.productions }
    } else {
      this.error(res.status, data.message)
    }
  }
</script>

<script>
  import Production from "../../components/Production.svelte"
  export let site
  export let productions
</script>

<h1 class="h1">Summer 2019 Productions</h1>

{#each productions as production}
  <Production {production} season={2019} />
{/each}
