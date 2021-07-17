---
# layout: post
title: Beauty and the Beast
featured: false
image: /images/2016/opening-beauty.jpg
---

<script lang="ts" context="module">
  import { load as p } from "../data/load"
  export const load = p
</script>

<script lang="ts">
  export let site
  import Markdown from "../../components/Markdown.svelte"
</script>

<Markdown source={site.data.productions["2016"][1].description} />

![](/images/2016/opening-beauty.jpg)
