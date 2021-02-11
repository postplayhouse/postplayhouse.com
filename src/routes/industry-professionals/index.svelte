<script lang="ts" context="module">
  type Post = {
    content: string
    active: boolean
    title: string
  }

  export function preload({ params, query }) {
    return this.fetch(`industry-professionals.json`)
      .then((r) => r.json())
      .then((posts: Post[]) => {
        return { posts: posts.filter((p) => p.active) }
      })
  }
</script>

<script lang="ts">
  import site from "../../data/site"
  import Markdown from "../../components/Markdown.svelte"
  export let posts: Post[]

  const title = "Work at Post Playhouse"

  let noOpenings = "There are currently no openings for our upcoming season."

  if (new Date() < new Date(site.season, 2)) {
    // Is past season end
    noOpenings +=
      "  We generally hold professional audtions and start looking for summer staff in the first quarter of the year."
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<h1 class="h1">{title}</h1>

<h2 class="h2 mb-4">Summer {site.season}</h2>

{#if posts.length}
  {#each posts as post}
    <Markdown source="{post.content}" />
  {/each}
{:else}
  <Markdown source="{noOpenings}" />
{/if}
