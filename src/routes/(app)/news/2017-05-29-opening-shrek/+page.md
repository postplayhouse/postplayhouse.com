---
# layout: post
title: Shrek is now showing!
single_featured: false
image: /images/2017/shrek-fb.png
---

<script lang="ts">
  import Markdown from "$components/Markdown.svelte"
  import yaml from "$data/_yaml"
  let imagePath = `/images/2017/${yaml.productions["2017"][0].image}`
</script>

![]({imagePath})

<Markdown source={yaml.productions["2017"][0].description} />
