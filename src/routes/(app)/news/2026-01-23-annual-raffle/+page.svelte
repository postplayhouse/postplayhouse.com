<script lang="ts">
	export const title = "Annual Raffle"
	export const excerpt =
		"Join us on March 14, 2026 for our annual raffle. You could win $5,000!"

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

<h5 class="mt-8 text-3xl leading-none">Saturday, March 14, 2026</h5>
<p class="text-xl">
	Crawford Community Center
	<br />
	1005 1st St., Crawford, NE
</p>

<h3 class="mt-8 mb-4 text-5xl leading-none font-bold">
	$100 Gets You All This:
</h3>
<ul class="ml-6 list-disc space-y-1 text-xl">
	<li>Admission for <strong>you and a guest</strong></li>
	<li>Dinner and drinks (5:00pm - 7:00pm)</li>
	<li>Entry into the raffle drawing (7:00pm)</li>
	<li>Cash bar and games with prizes all evening</li>
</ul>

<h5 class="mt-8 text-5xl leading-none font-bold">Prize Pay Outs</h5>
<p class="mb-2 text-lg">You need not be present to win.</p>
<ul class="prizes">
	<li>
		<span class="place">1st Prize (1 paid):</span>
		<span class="prize small-pop">$5,000</span>
	</li>
	<li>
		<span class="place">2nd Prize (2 paid):</span>
		<span class="prize small-pop">$1,000</span>
	</li>
	<li>
		<span class="place">3rd Prize (5 paid):</span>
		<span class="prize small-pop">$500</span>
	</li>
	<li>
		<span class="place">4th Prize (20 paid):</span>
		<span class="prize small-pop">$100</span>
	</li>
</ul>

<h3 class="mt-8 mb-4 text-5xl leading-none font-bold">Don't Miss Out!</h3>
<p class="mb-4 text-xl">
	<strong>Only 400 tickets available!</strong>
</p>
<a
	class="btn-p text-2xl transition-transform duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/40"
	href="https://www.zeffy.com/en-US/ticketing/post-playhouses-get-lucky-raffle--2026"
>
	Get Your Raffle Ticket Now
</a>
<p class="p mt-4 text-lg">
	You can also contact Danielle Lecher at 308-430-0939 to be put in touch with a
	Board Member, or email us at
	<a class="link-green" href={emailLink}>tickets@postplayhouse.com</a>.
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
			letter-spacing: 0.05em;
		}
	}
	.big-pop {
		color: #94d788;
		text-shadow:
			-0.1em -0.1em 0 #0a6216,
			-0.09em -0.09em 0 #0a6216,
			-0.08em -0.08em 0 #0a6216,
			-0.07em -0.07em 0 #0a6216,
			-0.06em -0.06em 0 #0a6216,
			-0.05em -0.05em 0 #0a6216,
			-0.04em -0.04em 0 #0a6216,
			-0.03em -0.03em 0 #0a6216,
			-0.02em -0.02em 0 #0a6216,
			-0.01em -0.01em 0 #0a6216,
			-0.095em -0.095em 0 #0a6216,
			-0.085em -0.085em 0 #0a6216,
			-0.075em -0.075em 0 #0a6216,
			-0.065em -0.065em 0 #0a6216,
			-0.055em -0.055em 0 #0a6216,
			-0.045em -0.045em 0 #0a6216,
			-0.035em -0.035em 0 #0a6216,
			-0.025em -0.025em 0 #0a6216,
			-0.015em -0.015em 0 #0a6216,
			-0.005em -0.005em 0 #0a6216;
	}
	.small-pop {
		color: #94d788;
		text-shadow:
			-0.01em -0.01em 0 #0a6216,
			-0.02em -0.02em 0 #0a6216,
			-0.03em -0.03em 0 #0a6216;
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
