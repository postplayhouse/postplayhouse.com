---
# layout: post
title: Cabaret
featured: false
image: /images/2016/opening-cabaret.jpg
---

<script lang="ts" context="module">
  import { preload as p } from "../data/preload"
  export const preload = p
</script>

<script lang="ts">
  export let site
  import Markdown from "../../components/Markdown.svelte"
</script>

<Markdown source={site.data.productions["2016"][4].description} />

![](/images/2016/opening-cabaret.jpg)

## Playing this summer:

![](/images/2016/seasonslide2016.jpg)
