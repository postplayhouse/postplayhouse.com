---
# layout: post
title: Mamma Mia opens June 9th!
single_featured: false
image: /images/2017/mamma-mia-fb.png
---

```js module
import { preload as p } from "../data/preload"
export const preload = p
```

```js exec
export let site

import Markdown from "../../components/Markdown.svelte"

let imagePath = `/images/2017/${site.data.productions["2017"][1].image}`
```

![Mamma Mia logo]({imagePath})

<Markdown source={site.data.productions["2017"][1].description} />
