---
# layout: post
title: Young Frankenstein opens July 7th!
single_featured: false
image: /images/2017/young-frankenstein-fb.png
---

```js module
import { preload as p } from "../data/preload"
export const preload = p
```

```js exec
export let site
import Markdown from "../../components/Markdown.svelte"
let imagePath = `/images/2017/${site.data.productions["2017"][4].image}`
```

![Young Frankenstein logo]({imagePath})

<Markdown source={site.data.productions["2017"][4].description} />
