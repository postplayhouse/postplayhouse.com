---
# layout: post
title: Beauty and the Beast
featured: false
image: /images/2016/opening-beauty.jpg
---

<script lang="ts" context="module">
  throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

  // import { load as p } from "../../data/load"
  // export const load = p
</script>

<script lang="ts">
  throw new Error("@migration task: Add data prop (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292707)");

  export let site
  import Markdown from "$components/Markdown.svelte"
</script>

<Markdown source={site.data.productions["2016"][1].description} />

![](/images/2016/opening-beauty.jpg)
