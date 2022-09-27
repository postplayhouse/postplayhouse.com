---
# layout: post
title: Mamma Mia opens June 9th!
single_featured: false
image: /images/2017/mamma-mia-fb.png
---

<script lang="ts" context="module">
  throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

  // import { load as p } from "$data/load"
  // export const load = p
</script>

<script lang="ts">
  throw new Error("@migration task: Add data prop (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292707)");

  export let site

  import Markdown from "$components/Markdown.svelte"

  let imagePath = `/images/2017/${site.data.productions["2017"][1].image}`
</script>

![Mamma Mia logo]({imagePath})

<Markdown source={site.data.productions["2017"][1].description} />
