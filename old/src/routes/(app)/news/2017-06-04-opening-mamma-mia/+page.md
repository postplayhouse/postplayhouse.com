---
# layout: post
title: Mamma Mia opens June 9th!
single_featured: false
image: /images/2017/mamma-mia-fb.png
---

<script lang="ts">
  export let data
  import Markdown from "$components/Markdown.svelte"
  let imagePath = `/images/2017/${data.yaml.productions["2017"][1].image}`
</script>

![Mamma Mia logo]({imagePath})

<Markdown source={data.yaml.productions["2017"][1].description} />
