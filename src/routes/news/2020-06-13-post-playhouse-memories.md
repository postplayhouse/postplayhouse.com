---
# layout: post
title: "Post Playhouse Memories"
sticky: false
---

```js exec
import { showDonateModal } from "../../data/stores"
```

```css style
p,
ul {
  margin-bottom: 1em;
}
```

Several Post Playhouse alumni from over the years created a video message to share with all our wonderful patrons.

<iframe src="https://player.vimeo.com/video/428506727" class="m-auto max-w-full my-4" width="640" height="320" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>

We hope you enjoyed the messages from Post Playhouse alumni in the video above. If you are interested in making a fully tax-deductible donation to the theatre, you can do so in one of two ways.

<div class="flex w-full justify-around">

<div>

### Send a check by mail

Post Playhouse  
c/o Tim Gaswick  
H&R Block  
P.O. Box 749  
Chadron, NE 69337

</div>
<div>

### Donate online

<div class="text-center my-4">
  <button class="btn btn-p" on:click={showDonateModal.toggle}>Donate Online Now</button>
</div>

</div>
</div>
