<script lang="ts" context="module">
  export async function preload({ params, query }) {
    const res = await this.fetch(`data/productions/2019.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { productions: data.productions }
    } else {
      this.error(res.status, data.message)
    }
  }
</script>

<script lang="ts">
  import Production from "../../components/Production.svelte"
  export let productions
</script>

<h1 class="h1">Summer 2019 Productions</h1>

{#each productions as production}
  <Production production="{production}" season="{2019}" />
{/each}
