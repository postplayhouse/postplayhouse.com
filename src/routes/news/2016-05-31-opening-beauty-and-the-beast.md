---
# layout: post
title: Beauty and the Beast
featured: false
image: /images/2016/opening-beauty.jpg
---

```js module
import { preload as p } from "../data/preload"
export const preload = p
```

```js exec
export let site
import Markdown from "../../components/Markdown.svelte"
```

<Markdown source={site.data.productions["2016"][1].description} />

![](/images/2016/opening-beauty.jpg)
