<script>
  export let data
  const { site } = data
</script>

<header
  class="flex flex-col justify-around sm:flex-row items-center max-w-4xl mx-auto">

  <div class="flex-auto max-w-xl">
    <a href="{site.baseurl}/" title="Post Playhouse" rel="home">
      <img
        src="{site.baseurl}/images/post-nameplate-colors.svg"
        alt="Post Playhouse Title Logo" />
      <h1 class="hidden">{site.title}</h1>
    </a>
    <h2 class="font-hairline text-center text-xl tracking-wide">
      Professional talent from across the country...
      <span style="white-space:nowrap">So close to home</span>
    </h2>
  </div>

  <div class="flex-initial text-center mt-8 ml-2 min-w-md">
    <a href={site.tickets_link} class="btn">Get Tickets Online</a>

    <a
      class="text-green-700 underline sm:block sm:mt-4"
      href="{site.baseurl}/ticket-info/">
      Ticket Information
    </a>
    <a
      class="mt-2 text-lg block"
      href="tel:+{site.box_office_phone.replace(/-/g, '')}">
      {site.box_office_phone}
    </a>
  </div>

</header>
