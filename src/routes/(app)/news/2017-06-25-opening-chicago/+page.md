---
# layout: post
title: Chicago opens June 30th!
single_featured: false
image: /images/2017/chicago-fb.png
---

<script lang="ts">
  import Markdown from "$components/Markdown.svelte"
  import SeasonImage from "$components/SeasonImage.svelte"
  import yaml from "$data/_yaml"

  let production = yaml.productions["2017"][3]
</script>

<SeasonImage season="2017" imageFile={production.image} alt="{production.title} logo" />

<Markdown source={production.description} />
