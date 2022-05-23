<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  import { marked } from "marked"

  marked.setOptions({ smartypants: true })

  export const load: Load = async (obj) => {
    const peopleRes = await obj.fetch(`/data/people/2022.json`)
    const peopleData = await peopleRes.json()
    if (peopleRes.status !== 200)
      return { status: 500, error: new Error(peopleData.message) }

    return {
      props: {
        people: peopleData.people,
      },
    }
  }
</script>

<script lang="ts">
  import Slideshow from "$components/slideshow/Lobby2022.svelte"

  export let people: YamlPerson[]
</script>

<Slideshow actors="{people}" />
