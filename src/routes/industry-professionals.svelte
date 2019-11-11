<script context="module">
  import { preload as p } from "./data/preload"
  export const preload = p
</script>

<script>
  export let site
  export let title = "Work at Post Playhouse"
  const productions = site.data.productions[site.season]
</script>

<h2 class="h2">Summer {site.season}</h2>

<h3 class="h3">Professional Auditions (by appointment)</h3>

<strong class="my-2">NYC &mdash; January 25, {site.season}</strong>

<p class="my-4">
  Seeking actors to play multiple roles in 4 of 5 shows in our repertory season:
</p>

<ul>
  {#each productions as production}
    <li>{production.title}</li>
  {/each}
</ul>
<p class="my-4">
  This is a 14 week contract with competitive pay from May 11 to August 16.
  Auditions will be by appointment only, so please
  <strong>INCLUDE ALL OF THE FOLLOWING</strong>
  in an email to
  <a href="mailto:auditions@postplayhouse.com">auditions@postplayhouse.com</a>
  :
</p>

<ol>
  <li>Headshot</li>
  <li>Resum&eacute;</li>
  <li>
    Links to video clips. These may be actual performance videos featuring you
    singing solo, or simply 32 bars of your best song. (Please do not attach
    videos directly in the email. Use links to YouTube, Vimeo, etc.)
  </li>
</ol>

<strong class="my-2 block">
  Email submissions which fail to include all three of the above will not be
  considered.
</strong>

<p class="my-2">We look forward to hearing from you!</p>

<h3 class="h3 mt-4">Local Actor Auditions TBA</h3>
in Late April or Early May {site.season}
<img
  class="mt-5"
  alt="outside front entrance of Post Playhouse"
  src="/images/playhouse-pic-large.jpg" />
