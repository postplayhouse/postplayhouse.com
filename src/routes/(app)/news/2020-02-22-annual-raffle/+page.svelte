<script lang="ts">
  throw new Error("@migration task: Add data prop (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292707)");

  export const title = "Annual Raffle"
  export const excerpt =
    "Join us on March 21, 2020 for our annual raffle. You could win $5,000!"
</script>

<h3 class="big-pop title">Get Lucky!</h3>

<h4 class="small-pop text-5xl font-bold leading-none">
  with the
  <span class="relative inline-block sm:whitespace-nowrap">
    P
    <img
      src="/images/perennials/shamrock.svg"
      class="shamrock"
      alt="four leaf clover replacing the letter O in Post Playhouse"
    />
    st Playhouse
  </span>
  <span class="sm:whitespace-nowrap">Board of Directors</span>
</h4>

<h5 class="text-3xl mt-8 leading-none">Join us for our Annual Raffle!</h5>
<p class="font-bold text-3xl mt-4 leading-none">
  Saturday, March 21, 2020 at 5:30pm
</p>
<p class="text-xl">
  Fort Robinson State Park
  <br />
  Buffalo Soldier’s Barracks
  <br />
  <span class="text-base">(Nebraska State Park Sticker Required)</span>
</p>

<h5 class="text-5xl font-bold mt-8 leading-none">Prize Pay Outs</h5>
<ul class="prizes">
  <li>
    <span class="place">1st Prize (1 paid):</span>
    <span class="prize small-pop">$5,000</span>
  </li>
  <li>
    <span class="place">2nd Prize (5 paid):</span>
    <span class="prize small-pop">$1,000</span>
  </li>
  <li>
    <span class="place">3rd Prize (4 paid):</span>
    <span class="prize small-pop">$500</span>
  </li>
  <li>
    <span class="place">4th Prize (24 paid):</span>
    <span class="prize small-pop">$100</span>
  </li>
</ul>

<h3 class="text-5xl font-bold leading-none mb-4">
  Get Your Raffle Ticket Now!
</h3>
<h4 class="text-3xl leading-none mb-2">It’s more than just a raffle</h4>
<p class="p mb-2">
  The purchase of a raffle ticket also allows
  <strong>you and a guest</strong>
  to join us at the fund-raiser. You'll enjoy dinner, wine, beer, and have a great
  time!
</p>
<p class="p mb-2">
  Bring some extra cash for the silent auction and to play other games and win
  other prizes!
</p>

<h4 class="text-3xl leading-none mt-4 mb-2">
  Only 400 raffle tickets will be sold!
</h4>

<p class="p">
  Raffle tickets are $100 each. Get yours from a Post Playhouse Board Member
  today!
</p>

<h5 class="text-xl mt-4">Board Member Contact Information</h5>
<p>
  You can purchase from any Board Member you know personally, but here is the
  contact information for those that are available at the moment:
</p>

<ul>
  <li>
    Wally Seiler
    <br />
    <a href="mailto:wseiler@charter.net">wseiler@charter.net</a>
    <br />
    308-760-4693
  </li>
  <li>
    Alex Helmbrecht
    <br />
    <a href="mailto:ahelmbrecht@csc.edu">ahelmbrecht@csc.edu</a>
    <br />
    308-432-6212
  </li>
  <li>
    Jessica Espinoza via Crawford Clipper-Harrison Sun
    <br />
    308-665-2310
  </li>
</ul>

<style>
  .title {
    margin: 0 auto;
    width: 100%;
    line-height: 1;
    font-size: 80px;
    font-weight: bold;
  }
  @media (min-width: 650px) {
    .title {
      font-size: 122px;
    }
  }
  @media (min-width: 850px) {
    .title {
      font-size: 160px;
    }
  }
  .big-pop {
    color: #94d788;
    text-shadow: -0.1em -0.1em 0 #033f0b, -0.09em -0.09em 0 #033f0b,
      -0.08em -0.08em 0 #033f0b, -0.07em -0.07em 0 #033f0b,
      -0.06em -0.06em 0 #033f0b, -0.05em -0.05em 0 #033f0b,
      -0.04em -0.04em 0 #033f0b, -0.03em -0.03em 0 #033f0b,
      -0.02em -0.02em 0 #033f0b, -0.01em -0.01em 0 #033f0b,
      -0.095em -0.095em 0 #033f0b, -0.085em -0.085em 0 #033f0b,
      -0.075em -0.075em 0 #033f0b, -0.065em -0.065em 0 #033f0b,
      -0.055em -0.055em 0 #033f0b, -0.045em -0.045em 0 #033f0b,
      -0.035em -0.035em 0 #033f0b, -0.025em -0.025em 0 #033f0b,
      -0.015em -0.015em 0 #033f0b, -0.005em -0.005em 0 #033f0b;
  }
  .small-pop {
    color: #94d788;
    text-shadow: -0.01em -0.01em 0 #033f0b, -0.02em -0.02em 0 #033f0b,
      -0.03em -0.03em 0 #033f0b;
  }
  .prizes {
    margin: 1em auto;
    list-style: none;
    padding-left: 0;
    font-size: 1.5em;
    max-width: 24rem;
  }
  .prizes li {
    display: flex;
    flex-wrap: wrap;
    max-width: 24rem;
    justify-content: space-between;
  }
  .prize {
    font-weight: bold;
    font-size: 1.5em;
  }
  .prizes li:nth-of-type(1) {
    font-size: 1.2em;
  }
  .shamrock {
    width: 1.4ex;
    height: 1.4ex;
    display: inline-block;
    margin: 0 -0.3em;
  }
  .p {
    max-width: 36em;
  }
</style>
