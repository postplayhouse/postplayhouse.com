<script lang="ts" context="module">
  import { marked } from "marked"

  marked.setOptions({ smartypants: true })
</script>

<script lang="ts">
  import Slideshow from "$components/slideshow/Lobby2022.svelte"

  import type { PageData } from "./$types"
  export let data: PageData
</script>

<Slideshow actors="{data.people}" />
