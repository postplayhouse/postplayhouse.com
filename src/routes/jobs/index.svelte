<script lang="ts" context="module">
  type Post = {
    content: string
    active: boolean
    title: string
  }

  export function preload({ params, query }) {
    return this.fetch(`jobs.json`)
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

  const today = new Date()
  const marchOfCurrentSeason = new Date(site.season, 2)
  const midAugustOfCurrentSeason = new Date(site.season, 7, 20)

  const isAfterCurrentSeason = today > midAugustOfCurrentSeason
  const isBeforeMarchOfCurrentSeason = today < marchOfCurrentSeason

  if (isAfterCurrentSeason || isBeforeMarchOfCurrentSeason) {
    noOpenings +=
      " We generally hold professional audtions and start looking for summer staff in the first quarter of the year."
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<h1 class="h1">{title}</h1>

<p class="bg-green-200 p-4 my-4">
  <strong>Notice:</strong>
  Due to continuing health concerns, we are holding off on announcing our 2021
  season until we have more information. We will update this page as soon as we
  have finalized plans for 2021.
</p>

<h2 class="h2 mb-4">Summer {site.season}</h2>

{#if posts.length}
  {#each posts as post}
    <Markdown source="{post.content}" />
  {/each}
{:else}
  <Markdown source="{noOpenings}" />
{/if}

<hr class="mt-8" />

<p class="mt-4">
  You can subscribe to our job notifications so you never miss when a new job or
  audition notice goes live:
</p>

<ul class="list-none">
  <li>
    RSS:
    <a
      class="link-green"
      href="{site.url}/jobs/feeds/rss">{site.url}/jobs/feeds/rss</a>
  </li>
</ul>
