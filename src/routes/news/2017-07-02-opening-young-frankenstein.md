---
# layout: post
title: Young Frankenstein opens July 7th!
single_featured: false
image: /images/2017/young-frankenstein-fb.png
---

<script lang="ts" context="module">
  import { load as p } from "../data/load"
  export const load = p
</script>

<script lang="ts">
  export let site
  import Markdown from "../../components/Markdown.svelte"
  let imagePath = `/images/2017/${site.data.productions["2017"][4].image}`
</script>

![Young Frankenstein logo]({imagePath})

<Markdown source={site.data.productions["2017"][4].description} />
