---
# layout: post
title: Chicago opens June 30th!
single_featured: false
image: /images/2017/chicago-fb.png
---

<script lang="ts">
  export let data
  import Markdown from "$components/Markdown.svelte"
  let imagePath = `/images/2017/${data.yaml.productions["2017"][3].image}`
</script>

![Chicago logo]({imagePath})

<Markdown source={data.yaml.productions["2017"][3].description} />
