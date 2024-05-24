---
# layout: post
title: The hilarious Crazy For You is now showing!
single_featured: false
image: /images/2017/crazy-for-you-fb.png
---

<script lang="ts">
  import Markdown from "$components/Markdown.svelte"
  import yaml from "$data/_yaml"
  let imagePath = `/images/2017/${yaml.productions["2017"][2].image}`
</script>

![Crazy for You logo]({imagePath})

<Markdown source={yaml.productions["2017"][2].description} />
