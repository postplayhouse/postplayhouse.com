---
# layout: post
title: Young Frankenstein opens July 7th!
single_featured: false
image: /images/2017/young-frankenstein-fb.png
---

<script lang="ts">
  export let data
  import Markdown from "$components/Markdown.svelte"
  let imagePath = `/images/2017/${data.yaml.productions["2017"][4].image}`
</script>

![Young Frankenstein logo]({imagePath})

<Markdown source={data.yaml.productions["2017"][4].description} />
