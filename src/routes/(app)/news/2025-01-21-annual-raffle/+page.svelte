<script lang="ts">
	export const title = "Annual Raffle"
	export const excerpt =
		"Join us on March 15, 2025 for our annual raffle. You could win $5,000!"

	const emailBody = `I would like to purchase a raffle ticket. You can contact me via my information below:
		
YOUR INFO HERE
`

	const emailLink = `mailto:tickets@postplayhouse.com?subject=${encodeURIComponent(
		"Annual Raffle Ticket Request",
	)}&body=${encodeURIComponent(emailBody)}`
</script>

<h3 class="big-pop title">Get Lucky!</h3>

<h4 class="small-pop text-5xl leading-none font-bold">
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

<h5 class="mt-8 text-3xl leading-none">Join us for our Annual Raffle!</h5>
<p class="mt-4 text-3xl leading-none font-bold">
	Saturday, March 15, 2025 starting at 5:00pm
</p>
<p class="text-xl">
	Crawford Community Center
	<br />
	1005 1st St.
	<br />
	Crawford, NE
</p>

<h5 class="mt-8 text-5xl leading-none font-bold">Prize Pay Outs</h5>
You need not be present to win.
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

<h3 class="mb-4 text-5xl leading-none font-bold">Food, Friends, and Fun!</h3>
<h4 class="mb-2 text-3xl leading-none">It’s more than just a raffle</h4>
<p class="p mb-2">
	The purchase of a raffle ticket also allows
	<strong>you and a guest</strong>
	to join us at the fund-raiser. Come have a great time and enjoy the cash bar!
</p>

<p class="p mb-2">
	Bring some extra cash for the silent auction and to play other games and win
	other prizes!
</p>

<h3 class="mt-8 mb-4 text-5xl leading-none font-bold">
	Get Your Raffle Ticket Now!
</h3>
<h4 class="mt-4 mb-2 text-3xl leading-none">
	Only 400 raffle tickets will be sold!
</h4>

<p class="p">
	Raffle tickets are $100 each. Get yours from a Post Playhouse Board Member
	today! Don't know a Post Playhouse Board Member? No problem! Just email us at
	<a class="link-green" href={emailLink}>tickets@postplayhouse.com</a> and we'll
	put you in contact with a Board Member.
</p>

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
		text-shadow:
			-0.1em -0.1em 0 #033f0b,
			-0.09em -0.09em 0 #033f0b,
			-0.08em -0.08em 0 #033f0b,
			-0.07em -0.07em 0 #033f0b,
			-0.06em -0.06em 0 #033f0b,
			-0.05em -0.05em 0 #033f0b,
			-0.04em -0.04em 0 #033f0b,
			-0.03em -0.03em 0 #033f0b,
			-0.02em -0.02em 0 #033f0b,
			-0.01em -0.01em 0 #033f0b,
			-0.095em -0.095em 0 #033f0b,
			-0.085em -0.085em 0 #033f0b,
			-0.075em -0.075em 0 #033f0b,
			-0.065em -0.065em 0 #033f0b,
			-0.055em -0.055em 0 #033f0b,
			-0.045em -0.045em 0 #033f0b,
			-0.035em -0.035em 0 #033f0b,
			-0.025em -0.025em 0 #033f0b,
			-0.015em -0.015em 0 #033f0b,
			-0.005em -0.005em 0 #033f0b;
	}
	.small-pop {
		color: #94d788;
		text-shadow:
			-0.01em -0.01em 0 #033f0b,
			-0.02em -0.02em 0 #033f0b,
			-0.03em -0.03em 0 #033f0b;
	}
	.prizes {
		margin: 1em 0 1em 1em;
		list-style: none;
		padding-left: 0;
		font-size: 1.5em;
		max-width: 28rem;
	}
	.prizes li {
		display: flex;
		flex-wrap: wrap;
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
