---
# layout: post
title: Chicago opens June 30th!
single_featured: false
image: /images/2017/chicago-fb.png
---

<script lang="ts" context="module">
  import { preload as p } from "../data/preload"
  export const preload = p
</script>

<script lang="ts">
  export let site
  import Markdown from "../../components/Markdown.svelte"
  let imagePath = `/images/2017/${site.data.productions["2017"][3].image}`
</script>

![Chicago logo]({imagePath})

<Markdown source={site.data.productions["2017"][3].description} />
