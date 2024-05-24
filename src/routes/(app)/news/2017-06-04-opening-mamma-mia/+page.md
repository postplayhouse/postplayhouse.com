---
# layout: post
title: Mamma Mia opens June 9th!
single_featured: false
image: /images/2017/mamma-mia-fb.png
---

<script lang="ts">
  import Markdown from "$components/Markdown.svelte"
  import yaml from "$data/_yaml"
  let imagePath = `/images/2017/${yaml.productions["2017"][1].image}`
</script>

![Mamma Mia logo]({imagePath})

<Markdown source={yaml.productions["2017"][1].description} />
