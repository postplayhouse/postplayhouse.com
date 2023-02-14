---
title: "Donations to Post Playhouse"
---

<script lang="ts">
  import Mission from "$components/Mission.md"

  import site from "$data/site"
  import { showDonateModal } from "$data/stores"

  const sponsorAmount = site.season - 1967
</script>

<p class="text-center p-2 mb-4">As a 501(c)3 nonprofit, your contribution to Post Playhouse is fully tax-deductible.</p>

<div class="text-center my-4">
  <button class="btn btn-p" on:click={showDonateModal.toggle}>Donate Online Now</button>
</div>

## Our Mission

<Mission/>

## You can help

If you like our mission or are a fan of our productions, consider donating today. View our contributor levels below to see the benefits of donating to Post Playhouse.

<div class="text-center my-4">
  <button class="btn btn-p" on:click={showDonateModal.toggle}>Donate Online Now</button>
</div>

Please contact the box office at { site.boxOfficePhone } or email us at [elaudeman@postplayhouse.com](mailto:elaudeman@postplayhouse.com) with any questions about donating.

You can also send donations via mail:

Post Playhouse  
c/o Jim Gardner  
Casey Peterson LTD  
PO Box 447  
Chadron, NE 69337

Please make all checks payable to Post Playhouse and include your name, mailing address, and email address so we can contact you regarding your benefits.

# Contributor Levels

### Sponsor: ${sponsorAmount} -- $99

Invitations to exclusive donor events

### Sustainer: $100 -- $499

All Sponsor benefits plus name recognition in the theatre lobby and in our annual report

### Signature Supporter: $500 -- $999

All Sustainer benefits plus 2 complimentary tickets and invitations to an opening night performance and celebration of 1 show of your choice

### Artistic Director’s Society: $1,000 -- $5,999

All Signature Supporter benefits plus 2 more tickets and invitations to an opening night celebration

### Show Sponsor: $6,000 -- $9,999

All Artistic Director’s Society benefits plus 6 additional complimentary tickets (10 total) to the opening night performance and celebration of your sponsored show. Complimentary pre-show buffet for opening night for your 10 guests at the Fort Robinson Restaurant in the Lodge. Your name will receive recognition in the preshow announcement for each performance. Other perks include a behind the scenes tour, name recognition on our website, highway signs, and many other printed materials.

## Prefer to donate something else?

Contact us and we would be happy to let you know what our current needs are!

<div class="text-center my-4">
  <button class="btn btn-p" on:click={showDonateModal.toggle}>Donate Online Now</button>
</div>
