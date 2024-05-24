---
# layout: post
title: Young Frankenstein opens July 7th!
single_featured: false
image: /images/2017/young-frankenstein-fb.png
---

<script lang="ts">
  import Markdown from "$components/Markdown.svelte"
  import yaml from "$data/_yaml"
  let imagePath = `/images/2017/${yaml.productions["2017"][4].image}`
</script>

![Young Frankenstein logo]({imagePath})

<Markdown source={yaml.productions["2017"][4].description} />
