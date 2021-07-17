---
# layout: post
title: Shrek is now showing!
single_featured: false
image: /images/2017/shrek-fb.png
---

<script lang="ts" context="module">
  import { load as p } from "../data/load"
  export const load = p
</script>

<script lang="ts">
  export let site
  import Markdown from "../../components/Markdown.svelte"
  let imagePath = `/images/2017/${site.data.productions["2017"][0].image}`
</script>

![]({imagePath})

<Markdown source={site.data.productions["2017"][0].description} />
