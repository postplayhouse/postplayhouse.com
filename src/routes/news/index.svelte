<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  export const load: Load = (obj) => {
    return obj
      .fetch(`/news.json`)
      .then((r) => r.json())
      .then((posts) => {
        return { props: { posts } }
      })
  }
</script>

<script lang="ts">
  export let posts
</script>

<style>
  ul {
    margin: 0 0 1em 0;
    line-height: 1.5;
  }

  span {
    font-feature-settings: "tnum";
  }
</style>

<svelte:head>
  <title>News</title>
</svelte:head>

<h1>Recent posts</h1>

<ul>
  {#each posts as post}
    <!-- we're using the non-standard `rel=prefetch` attribute to
				tell Sapper to load the data for the page as soon as
				the user hovers over the link or taps it, instead of
				waiting for the 'click' event -->
    <li>
      <a rel="prefetch" href="news/{post.slug}">
        <span>{post.date}</span>
        {post.title}
      </a>
    </li>
  {/each}
</ul>
