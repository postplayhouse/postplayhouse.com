<script lang="ts">
  import site from "$data/site"
  import { dateIsBetween } from "$helpers"
  const title = "Gifts"

  const now_year = new Date().getFullYear()
  const is_holidays = dateIsBetween(`10/01/${now_year}`, `12/10/${now_year}`)
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<h1 class="h1">{title}</h1>

{#if is_holidays}
  <div class="p-4 border-2 border-green-800 bg-green-100 my-4">
    <h2 class="h2">Holiday Gift Extras</h2>

    <p>
      No matter when you purchase a Season Subscripton or Gift Certificate, you
      can always print them from downloadable files below. However, during the
      holidays, we like to lend a hand.
    </p>

    <p>
      If you've purchased a Season Subscription or a Gift Certificate prior to
      December 10 through our <a class="link-green" href="{site.ticketsLink}"
        >Online Box Office</a
      >, we will contact you via email and ask if you would like us to send you
      a pre-filled Subscription Card or Gift Certificate to present as a gift.
      Just reply to the email we sent you and we'll ship the cards to you before
      December 25th.
    </p>
  </div>
{/if}

<p class="my-4">
  When you buy a gift via our
  <a class="link-green" href="{site.ticketsLink}">Online Box Office</a>, you can
  print off any of our certificates/subscription cards below and give them to
  the recipient. Subscribers: even if it's not a gift, print off a subscription
  card for a convenient place to write down all the information about your shows
  after you reserve them.
</p>

<h2 class="h2">{site.season} Gift Certificate</h2>

<p>Click to download.</p>

<p>
  <a
    href="/documents/gift-certificate.pdf"
    download
    class="border-2 hover:border-green-800 border-transparent inline-block mb-8"
    ><img
      src="/documents/gift-certificate.jpg"
      alt="Gift Certificate"
      class="max-w-md"
    /></a
  >
</p>

<h2 class="h2">{site.season} Season Subscription Card</h2>

<p>Click to download.</p>

<p>
  <a
    href="/documents/subscription-card.pdf"
    download
    class="border-2 hover:border-green-800 border-transparent inline-block mb-8"
    ><img
      src="/documents/subscription-card.png"
      alt="Subscription Card"
      class="max-w-md"
    /></a
  >
</p>

<h2 class="h2">Post Playhouse Season Subscription Presentation Card</h2>

<p>Click to download.</p>

<p>
  <a
    href="/documents/subscription-presenter.pdf"
    download
    class="border-2 hover:border-green-800 border-transparent inline-block mb-8"
    ><img
      src="/documents/subscription-presenter.png"
      alt="Subscription Presentation Card"
      class="border-2 border-gray-200 max-w-md"
    /></a
  >
</p>
