---
# layout: post
title: Cabaret
featured: false
image: /images/2016/opening-cabaret.jpg
---

<script lang="ts">
  import Markdown from "$components/Markdown.svelte"
  import SeasonImage from "$components/SeasonImage.svelte"
  import yaml from "$data/_yaml"

  let production = yaml.productions["2016"][4]
</script>

<Markdown source={production.description} />

<SeasonImage season="2016" imageFile={production.image} alt="{production.title} logo" />

## Playing this summer:

<SeasonImage season="2016" imageFile="seasonslide2016.jpg" alt="2016 season ad" />
