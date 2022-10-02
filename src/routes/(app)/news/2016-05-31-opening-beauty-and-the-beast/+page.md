---
# layout: post
title: Beauty and the Beast
featured: false
image: /images/2016/opening-beauty.jpg
---

<script lang="ts">
  export let data
  import Markdown from "$components/Markdown.svelte"
</script>

<Markdown source={data.yaml.productions["2016"][1].description} />

![](/images/2016/opening-beauty.jpg)
