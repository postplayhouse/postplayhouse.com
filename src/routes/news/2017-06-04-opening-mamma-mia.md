---
# layout: post
title: Mamma Mia opens June 9th!
single_featured: false
image: /images/2017/mamma-mia-fb.png
---

<script lang="ts" context="module">
  import { preload as p } from "../data/preload"
  export const preload = p
</script>

<script lang="ts">
  export let site

  import Markdown from "../../components/Markdown.svelte"

  let imagePath = `/images/2017/${site.data.productions["2017"][1].image}`
</script>

![Mamma Mia logo]({imagePath})

<Markdown source={site.data.productions["2017"][1].description} />
