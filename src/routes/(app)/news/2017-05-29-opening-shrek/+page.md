---
# layout: post
title: Shrek is now showing!
single_featured: false
image: /images/2017/shrek-fb.png
---

<script lang="ts">
  export let data
  import Markdown from "$components/Markdown.svelte"
  let imagePath = `/images/2017/${data.yaml.productions["2017"][0].image}`
</script>

![]({imagePath})

<Markdown source={data.yaml.productions["2017"][0].description} />
