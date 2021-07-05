---
# layout: post
title: The hilarious Crazy For You is now showing!
single_featured: false
image: /images/2017/crazy-for-you-fb.png
---

<script lang="ts" context="module">
  import { load as p } from "../data/load"
  export const load = p
</script>

<script lang="ts">
  export let site
  import Markdown from "../../components/Markdown.svelte"
  let imagePath = `/images/2017/${site.data.productions["2017"][2].image}`
</script>

![Crazy for You logo]({imagePath})

<Markdown source={site.data.productions["2017"][2].description} />
