<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  import siteData from "../data/site"
  export const load: Load = async (obj) => {
    const res = await obj.fetch(`/data/productions/${siteData.season}.json`)
    const data = await res.json()

    if (res.status === 200) {
      return { props: { site: data.site, productions: data.productions } }
    } else {
      return { status: res.status, error: new Error(data.message) }
    }
  }
</script>

<script lang="ts">
  import SeatingChart from "../components/SeatingChart.svelte"
  import TicketPolicy from "../components/TicketPolicy.md"
  export let site
  export let productions = []
</script>

<style>
  /*  --------Ticket page tables------- */
  .tickets {
    line-height: 1.8em;
    border-collapse: collapse;
    font-size: 0.8em;
    margin-bottom: 18px;
  }

  .tickets .dotted_under {
    border-bottom-width: 1px;
    border-bottom-style: solid;
    border-bottom-color: #ccc;
  }

  .tickets th {
    font-weight: normal;
    font-size: 1.3em;
    background: #ccc;
    line-height: 2em;
  }

  .tickets .centered {
    text-align: center;
  }

  .tickets .info {
    font-size: 0.75em;
    line-height: 1em;
    padding-bottom: 5px;
  }

  .tickets .solid_under {
    border-bottom-width: 1px;
    border-bottom-style: solid;
    border-bottom-color: #000;
  }

  .tickets td:first-child {
    width: 25%;
    padding-left: 2%;
  }

  @media (min-width: 500px) {
    .subscription-pricing {
      display: inline-block;
      width: 49%;
      vertical-align: top;
    }
  }

  .subscriber-alert {
    font-size: 0.8em;
    line-height: 1.5em;
  }
  @media (min-width: 500px) {
    .subscriber-alert {
      display: inline-block;
      width: 50%;
      padding-left: 1%;
      padding-top: 3em;
    }
  }
</style>

<div class="via-markdown">
  <p>
    Ticket sales for every summer season begin November 1st of the previous
    calendar year.
  </p>

  {#if site.ticketsAvailable}
    <a class="link-green" href="{site.ticketsLink}">Buy yours now!</a><br />
  {/if}

  Or email us at
  <a class="link-green" href="mailto:tickets@postplayhouse.com"
    >tickets@postplayhouse.com</a
  ><br />

  Call our box office at
  <a class="x" href="tel:+{site.boxOfficePhone.replace(/-/g, '')}">
    {site.boxOfficePhone}
  </a>

  <h2 class="h2 mt-4 mb-2">Ticket Prices</h2>

  <table
    id="ticket-prices"
    class="tickets"
    width="100%"
    cellspacing="0"
    cellpadding="0"
  >
    <tbody>
      <tr>
        <td colspan="1"></td>
        <th colspan="2">June</th>
        <th colspan="2">July &amp; August</th>
      </tr>
      <tr>
        <td class="solid_under"></td>
        <td class="solid_under centered">Tues. - Thurs.</td>
        <td class="solid_under centered">Fri. - Sun.</td>
        <td class="solid_under centered">Tues. - Thurs.</td>
        <td class="solid_under centered">Fri. - Sun.</td>
      </tr>
      <tr class="dotted_under">
        <td>Adult</td>
        <td class="centered">$23</td>
        <td class="centered">$25</td>
        <td class="centered">$28</td>
        <td class="centered">$30</td>
      </tr>
      <tr class="dotted_under">
        <td>Senior <span class="info">(65+)</span></td>
        <td class="centered">$21</td>
        <td class="centered">$23</td>
        <td class="centered">$26</td>
        <td class="centered">$28</td>
      </tr>
      <tr class="dotted_under">
        <td>Youth <span class="info">(12-)</span></td>
        <td class="centered">$17</td>
        <td class="centered">$19</td>
        <td class="centered">$19</td>
        <td class="centered">$20</td>
      </tr>
      <tr>
        <td>Group <span class="info">(25 or more)</span></td>
        <td class="centered">$19</td>
        <td class="centered">$21</td>
        <td class="centered">$25</td>
        <td class="centered">$27</td>
      </tr>
    </tbody>
  </table>

  <h3 class="h3 mt-4 mb-2">Group Rates</h3>

  <p>
    Groups of 25 or more may purchase tickets at the rate noted above. Tickets
    may be added to a group sale (if seats are available) up to show date but
    are never reduced or refunded. The Post Playhouse cannot be responsible for
    unused group tickets.
  </p>

  <h2 class="h2 mt-4 mb-2">Subscription Pricing</h2>

  <p>
    Subscriptions are the best way to see what Post Playhouse has to offer each
    summer! With a Season Subscription, you get drastically discounted tickets
    on 4 or 5 different productions of your choosing. And since you don't have
    to pick your dates or seats at the time of purchase, they make great gifts.
  </p>

  <div class="subscription-pricing">
    <table
      id="subscription-prices"
      class="tickets"
      width="100%"
      cellspacing="0"
      cellpadding="0"
    >
      <tbody>
        <tr>
          <th colspan="3" scope="col">
            5 Show Subscriptions
            <div class="info">See 5 shows for less than the price of 4!</div>
          </th>
        </tr>
        <tr>
          <td width="33.333%" class="centered">Adult</td>
          <td width="33.333%" class="centered">
            Senior&nbsp;
            <span class="info">(65+)</span>
          </td>
          <td width="33.333%" class="centered">
            Youth&nbsp;
            <span class="info">(12-)</span>
          </td>
        </tr>
        <tr>
          <td class="centered">$110</td>
          <td class="centered">$105</td>
          <td class="centered">$80</td>
        </tr>
      </tbody>
    </table>

    <table
      id="subscription-prices"
      class="tickets"
      width="100%"
      cellspacing="0"
      cellpadding="0"
    >
      <tbody>
        <tr>
          <th colspan="3" scope="col">
            4 Show Season Subscriptions
            <div class="info">See 4 shows for nearly the price of 3!</div>
          </th>
        </tr>
        <tr>
          <td width="33.333%" class="centered">Adult</td>
          <td width="33.333%" class="centered">
            Senior
            <span class="info">(65+)</span>
          </td>
          <td width="33.333%" class="centered">
            Youth
            <span class="info">(12-)</span>
          </td>
        </tr>
        <tr>
          <td class="centered">$85</td>
          <td class="centered">$80</td>
          <td class="centered">$65</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="subscriber-alert">
    Subscribers: After purchasing your subscription, you can reserve your seats
    to any 4 or 5 performances by emailing us at
    <a href="mailto:tickets@postplayhouse.com">tickets@postplayhouse.com</a>
    or calling our box office at
    <a class="x" href="tel:+{site.boxOfficePhone.replace(/-/g, '')}"
      >{site.boxOfficePhone}</a
    >. Seats are based on availability, so please make your reservations as soon
    as you can.
  </div>

  <h3 class="h3 mt-4 mb-2">Season Subscriptions {site.season}</h3>

  <p>
    Please choose from the following shows to fill out your season subscription:
  </p>

  <ol class="my-2">
    {#each productions as production}
      <li>{production.title}</li>
    {/each}
  </ol>

  <p>
    Please remember that seats can only be reserved based on availability, so
    call the box office to secure your seats. Also note, as stated above,
    subscriptions may only be used on 4 or 5
    <em>different productions</em>. This means they cannot be used to see the
    same production multiple times.
  </p>

  <h2 class="h2 mt-4 mb-2">Seating Chart</h2>

  <SeatingChart />

  <TicketPolicy />
</div>
