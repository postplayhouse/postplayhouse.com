---
# layout: post
title: Chicago opens June 30th!
single_featured: false
image: /images/2017/chicago-fb.png
---

<script lang="ts">
  import Markdown from "$components/Markdown.svelte"
  import yaml from "$data/_yaml"
  let imagePath = `/images/2017/${yaml.productions["2017"][3].image}`
</script>

![Chicago logo]({imagePath})

<Markdown source={yaml.productions["2017"][3].description} />
