<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"

  type Post = {
    content: string
    active: boolean
    title: string
  }

  export const load: Load = (obj) => {
    return obj
      .fetch(`/jobs.json`)
      .then((r) => r.json())
      .then((posts: Post[]) => {
        return { props: { posts: posts.filter((p) => p.active) } }
      })
  }
</script>

<script lang="ts">
  import site from "../../data/site"
  import Markdown from "../../components/Markdown.svelte"
  import Modal from "../../components/Modal/Modal.svelte"
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

  let showFeedsLinks = false
  const toggleFeedsLinks = () => (showFeedsLinks = !showFeedsLinks)
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<h1 class="h1">{title}</h1>

<p class="bg-green-200 p-4 my-4">
  <strong>Notice:</strong>
  Due to continuing health concerns, we are holding off on announcing our 2021 season
  until we have more information. We will update this page as soon as we have finalized
  plans for 2021.
</p>

<div class="flex items-center my-4">
  <h2 class="h2">Summer {site.season}</h2>
  <button class="btn btn-p ml-4" on:click="{toggleFeedsLinks}">
    Subscribe to Jobs
  </button>
</div>

{#if posts.length}
  {#each posts as post}
    <Markdown source="{post.content}" />
  {/each}
{:else}
  <Markdown source="{noOpenings}" />
{/if}

{#if showFeedsLinks}
  <Modal on:close="{toggleFeedsLinks}">
    <p class="my-4">
      You can subscribe to our job notifications so you never miss when a new
      job or audition notice goes live:
    </p>

    <ul class="my-4 list-none p-0">
      <li>
        RSS:
        <a class="link-green" href="{site.url}/jobs/feeds/rss"
          >{site.url}/jobs/feeds/rss</a
        >
      </li>
      <li class="mt-2">
        JSON Feed:
        <a class="link-green" href="{site.url}/jobs/feeds/json"
          >{site.url}/jobs/feeds/json</a
        >
      </li>
    </ul>

    <p class="mt-8 text-sm">
      Don't know what those links are? If you have an RSS reader you can give it
      one of the links above (probably the RSS one) and it will subscribe you to
      this page. Kind of like podcasts, but for reading. And instead of giving
      the url above to iTunes (or your favorite podcast player), you'll give it
      to
      <a class="link-green" href="https://netnewswire.com">NetNewsWire</a>,
      <a class="link-green" href="https://feedly.com">Feedly</a>, or your
      favorite RSS app.
    </p>
  </Modal>
{/if}
