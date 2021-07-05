<script lang="ts" context="module">
  export async function load(obj) {
    const res = await obj.fetch(`data/productions/2019.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { productions: data.productions }
    } else {
      obj.error(res.status, data.message)
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
