<script>
  const yearsWithPages = [2019, 2020]

  const routes = ["/", "/bio-submission", "/calendar", "/productions"]
    .concat(yearsWithPages.map((y) => `/productions/${y}`))
    .concat(yearsWithPages.map((y) => `/who/${y}`))
</script>

<ul>
  {#each routes as route}
    <li><a href="{route}">{route}</a></li>
  {/each}
</ul>
