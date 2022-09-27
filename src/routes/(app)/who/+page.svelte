<script lang="ts">
  import type { PageData } from ".svelte-kit/types/src/routes/(app)/who/$types"
  export let data: PageData

  const { seasons } = data
  const years = Object.keys(seasons)
</script>

<ul>
  {#each years as year}
    <li><a href="{`/who/${year}`}">{year}</a></li>
  {/each}
</ul>
