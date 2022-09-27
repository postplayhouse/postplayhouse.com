---
title: Gifts
---

<script lang="ts">
  import site from "$data/site"
  import { dateIsBetween } from "../../helpers"

  const now_year = new Date().getFullYear()
  const is_holidays = dateIsBetween(`10/01/${now_year}`, `12/10/${now_year}`)
</script>

{#if is_holidays}

<div class="p-4 border-2 border-green-800 bg-green-100 mb-4">

## Holiday Gift Extras

No matter when you purchase a Season Subscripton or Gift Certificate, you can always print them from downloadable files below. However, during the holidays, we like to lend a hand.

If you've purchased a Season Subscription or a Gift Certificate prior to December 10 through our [Online Box Office]({site.ticketsLink}), we will contact you via email and ask if you would like us to send you a pre-filled Subscription Card or Gift Certificate to present as a gift. Just reply to the email we sent you and we'll ship the cards to you before December 25th.

</div>
{/if}

When you buy a gift via our [Online Box Office]({site.ticketsLink}), you can print off any of our certificates/subscription cards below and give them to the recipient.

Subscribers: even if it's not a gift, print off a subscription card for a convenient place to write down all the information about your shows after you reserve them.

## { site.season } Gift Certificate

Click to download.

<a href="/documents/gift-certificate.pdf" download class="border-2 hover:border-green-800 border-transparent inline-block mb-8"><img src="/documents/gift-certificate.jpg" alt="Image of Gift Certificate" class="max-w-md"/></a>

## { site.season } Season Subscription Card

Click to download.

<a href="/documents/subscription-card.pdf" download class="border-2 hover:border-green-800 border-transparent inline-block mb-8"><img src="/documents/subscription-card.png" alt="Image of Subscription Card" class="max-w-md"/></a>

## Post Playhouse Season Subscription Presentation Card

Click to download.

<a href="/documents/subscription-presenter.pdf" download class="border-2 hover:border-green-800 border-transparent inline-block mb-8"><img src="/documents/subscription-presenter.png" alt="Image of Subscription Presentation Card" class="border border-gray-100 max-w-md"/></a>
