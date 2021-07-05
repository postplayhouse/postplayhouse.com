<script lang="ts" context="module">
  export async function load(obj) {
    const res = await obj.fetch(`data/productions/${obj.params.slug}.json`)
    const data = await res.json()

    if (res.status === 200) {
      return {
        productions: data.productions,
        slug: obj.params.slug,
      }
    } else {
      obj.error(res.status, data.message)
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
