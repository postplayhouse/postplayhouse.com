<script lang="ts">
  const yearsWithPages = [2019, 2020]
  const yearsWithCalendars = [2020]

  const routes = [
    "/",
    "/bio-submission",
    "/calendar",
    "/productions",
    "/jobs/feeds/rss",
    "/jobs/feeds/json",
  ]
    .concat(yearsWithPages.map((y) => `/productions/${y}`))
    .concat(yearsWithPages.map((y) => `/who/${y}`))
    .concat(yearsWithCalendars.map((y) => `/calendar/${y}`))
</script>

<ul>
  {#each routes as route}
    <li><a href="{route}">{route}</a></li>
  {/each}
</ul>
