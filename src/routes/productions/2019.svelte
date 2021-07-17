<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"

  export const load: Load = async (obj) => {
    const res = await obj.fetch(`/data/productions/2019.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { props: { productions: data.productions } }
    } else {
      return { status: res.status, error: new Error(data.message) }
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
