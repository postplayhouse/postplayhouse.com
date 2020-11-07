<script context="module">
  export async function preload({ params, query }) {
    const res = await this.fetch(`data/productions/2020.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { site: data.site, productions: data.productions }
    } else {
      this.error(res.status, data.message)
    }
  }
</script>

<script>
  import Production from "../../components/Production.svelte"
  export let site
  export let productions
</script>

<!-- ---
title: Summer 2020 Productions
permalink: /productions/2020/
season: "2020"
layout: page
nav_title: Our Shows
group: main
image: /images/2020/full-season.jpg
description: Our 2020 summer season is packed with shows that are sure to please! Cats, Catch Me If You Can, Annie, Damn Yankees, and Church Basement Ladies. There's something for everyone at Post Playhouse!
order: 2
regenerate: true
--- -->

<h1 class="h1">Summer 2020 Productions</h1>

<img src="/images/2020/full-season.jpg" alt="" />
<div class="my-4 text-center">
  Tickets are on sale now!
  <br />
  <br />
  <a class="btn btn-p" href="{site.ticketsLink}">Get Your Tickets Now!</a>
</div>

{#each productions as production}
  <Production production="{production}" season="{2020}" />
{/each}
