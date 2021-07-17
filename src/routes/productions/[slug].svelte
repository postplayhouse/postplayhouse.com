<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"

  export const load: Load = async (obj) => {
    const res = await obj.fetch(
      `/data/productions/${obj.page.params["slug"]}.json`,
    )
    const data = await res.json()

    if (res.status === 200) {
      return {
        props: {
          productions: data.productions,
          slug: obj.page.params["slug"],
        },
      }
    } else {
      return { status: res.status, error: new Error("poo poo") }
    }
  }
</script>

<script lang="ts">
  import Production from "../../components/Production.svelte"
  export let productions
  export let slug
</script>

<h1 class="h1">Summer {slug} Productions</h1>

{#each productions as production}
  <Production production="{production}" season="{slug}" />
{/each}
