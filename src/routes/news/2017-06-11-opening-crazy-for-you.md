---
# layout: post
title: The hilarious Crazy For You is now showing!
single_featured: false
image: /images/2017/crazy-for-you-fb.png
---

```js module
import { preload as p } from "../data/preload"
export const preload = p
```

```js exec
export let site
import Markdown from "../../components/Markdown.svelte"
let imagePath = `/images/2017/${site.data.productions["2017"][2].image}`
```

![Crazy for You logo]({imagePath})

<Markdown source={site.data.productions["2017"][2].description} />
