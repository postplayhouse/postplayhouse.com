---
# layout: post
title: Bald Mountain Rounders
featured: false
image: /images/2016/opening-bmr.jpg
---

<script lang="ts" context="module">
  import { preload as p } from "../data/preload"
  export const preload = p
</script>

<script lang="ts">
  export let site
  import Markdown from "../../components/Markdown.svelte"
</script>

<Markdown source={site.data.productions['2016'][0].description} />

![Bald Mountain Rounders perform May 28th](/images/2016/opening-bmr.jpg)
