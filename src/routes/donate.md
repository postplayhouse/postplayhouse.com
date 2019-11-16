---
title: "Donations to Post Playhouse"
---

```js exec
import site from "../data/site"
import Modal from "../components/Modal.svelte"
import Mission from "../components/Mission.md"

$: showDonateForm = false

function toggleDonateForm() {
  showDonateForm = !showDonateForm
}
```

{#if showDonateForm}
<Modal on:close={toggleDonateForm}>

  <h2 class="h2">Donate Now!</h2>

  <iframe title="Donate to Post Playhouse" name='ELEOForm' id='ELEOForm' style='width:100%;min-width:320px;max-width:900px;min-height:1000px;border-width:0px;border-style:none;' scrolling='no' src='https://www.eleoonline.net/Pages/WebForms/Mobile/ShowFormMobile.aspx?id=f790c257-b67f-4508-9ff9-0fc3a16f04d2&linkto=670' ></iframe>
</Modal>
{/if}

<p class="text-center p-2 mb-4">Post Playhouse is a 501(c)(3) non-profit organization.</p>

<div class="text-center my-4">
  <button class="btn btn-p" on:click={toggleDonateForm}>Donate Online Now</button>
</div>

## Our Mission

<Mission/>

## You can help

If you like our mission or are a fan of our productions, consider donating today. View our contributor levels below to see the benefits of donating to Post Playhouse.

<div class="text-center my-4">
  <button class="btn btn-p" on:click={toggleDonateForm}>Donate Online Now</button>
</div>

Please contact the box office at { site.box_office_phone } or email us at [tom@postplayhouse.com](mailto:tom@postplayhouse.com) with any questions about donating.

You can also send donations via mail:

Post Playhouse  
c/o Tim Gaswick  
H&R Block  
P.O. Box 749  
Chadron, NE 69337

Please make all checks payable to Post Playhouse and include your name, mailing address, and email address so we can contact you regarding your benefits.

# Contributor Levels

### Sponsor --- \$50

- Your name listed in lobby display of contributors
- Be the first to hear next year's season announcement
- Receive our annual report

### Friend --- \$250

- Your name listed in lobby display of contributors
- 2 complimentary tickets for opening night for the show of your choice
- Be the first to hear next year's season announcement
- Receive our annual report

### Benefactor --- \$500

- Your name listed in lobby display of contributors
- 4 complimentary tickets for opening night for the show of your choice
- Join our backstage celebration following opening night for the show of your choice
- Be the first to hear next year's season announcement
- Receive our annual report

### Director --- \$1,000

- Your name listed in lobby display of contributors
- 6 complimentary tickets for opening night for the show of your choice
- Join our backstage celebration following opening night for the show of your choice
- Be the first to hear next year's season announcement
- Receive our annual report

### Show Sponsor --- \$5,000

- Company logo and sponsorship listing in:
  - Post Playhouse season brochures: 10,000 print copies
  - Crawford Clipper listing: 11,000 print copies
  - Listing at entrance of post playhouse and at Fort Robinson Lodge (seen by 20,000 guests)
- Sponsorship announcement prior to each performance of your show ("this show is being sponsored by...")
- 10 complimentary tickets for opening night of your sponsored show
- Complimentary pre-show buffet for opening night for your 10 guests at the Fort Robinson Restaurant in the Lodge

## Prefer Capital Donations?

Sponsor one of our Interns (\$3,000). Sponsor new furniture in our actor housing. Sponsor additional housing for our company. Donate needed box office and lobby technology. The sky is the limit!

<div class="text-center my-4">
  <button class="btn btn-p" on:click={toggleDonateForm}>Donate Online Now</button>
</div>
