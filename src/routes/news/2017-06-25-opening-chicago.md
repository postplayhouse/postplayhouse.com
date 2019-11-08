---
# layout: post
title: Chicago opens June 30th!
single_featured: false
image: /images/2017/chicago-fb.png
---

```js module
import { preload as p } from "../data/preload"
export const preload = p
```

```js exec
export let site
import Markdown from "../../components/Markdown.svelte"
let imagePath = `/images/2017/${site.data.productions["2017"][3].image}`
```

![Chicago logo]({imagePath})

<Markdown source={site.data.productions["2017"][3].description} />
