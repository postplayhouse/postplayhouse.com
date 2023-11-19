<script lang="ts">
	export const title = "Annual Raffle"
	export const excerpt =
		"Join us on March 14, 2015 for our annual raffle. You could win $10,000!"
</script>

<div class="full lucky">
	<h3>Get Lucky</h3>
	<img src="/images/perennials/shamrock.svg" class="shamrock" alt="shamrock" />
	<h4>with the <span>Post Playhouse</span> Board of Directors!</h4>
	<p class="clear">Join us for the Post Playhouse Inc. Annual Raffle!</p>
	<p class="pop">
		Saturday, March 14, 2015 <span class="no-break">from 5:30-7pm</span>
	</p>
	<p>
		Fort Robinson State Park<br />
		Buffalo Soldier's Barracks<br />
		<span class="info">Park Sticker Required</span>
	</p>
	<ul class="prizes">
		<li>1st Prize: <span class="prize">$10,000</span></li>
		<li>2nd Prize: <span class="prize">$1,000</span></li>
		<li>Every 10th Ticket: <span class="prize">$100</span></li>
	</ul>

	<p class="long group">
		<img
			src="/images/perennials/homestead.png"
			class="homestead"
			alt="High Plains Homestead Logo"
		/>Raffle tickets are priced at $100 each. The purchase of a raffle ticket
		allows you and a guest to join us at the fund-raiser. You'll enjoy hors
		d'oeuvres, wine, and have a great time!
	</p>

	<div class="purchase-info">
		<h4>Only 200 Raffle Tickets Available!</h4>
		<p class="long">
			Get yours from a <a href="/who/2015/#board">Post Playhouse Board Member</a
			>
			or by contacting the Craford Clipper: <br />
			email:
			<a href="mailto:crawfordclipper@gmail.com">crawfordclipper@gmail.com</a
			><br />
			phone: 308-665-2310
		</p>
	</div>
</div>

<style>
	.group {
		*zoom: 1;
	}
	.group:after {
		content: "";
		display: table;
		clear: both;
	}

	.no-break {
		white-space: nowrap;
	}

	.clear {
		clear: both;
	}

	.lucky {
		padding: 12px;
		background-color: #359325;
		line-height: 1;
		color: rgba(255, 255, 255, 0.9);
		position: relative;
		z-index: 0;
	}
	.lucky > * {
		z-index: 1;
		position: relative;
	}
	.lucky a,
	.lucky a:link,
	.lucky a:visited,
	.lucky a:hover {
		color: #94d788;
	}
	.lucky h3,
	.lucky h4 {
		margin: 0 auto;
		width: 100%;
		line-height: 1;
		color: rgba(255, 255, 255, 0.9);
	}
	.lucky h3 {
		color: #94d788;
		font-size: 62px;
		font-weight: bold;
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
	@media (min-width: 500px) {
		.lucky h3 {
			font-size: 122px;
		}
	}
	@media (min-width: 1000px) {
		.lucky h3 {
			font-size: 172px;
		}
	}
	.lucky h4 {
		text-align: left;
		margin-bottom: 1em;
		clear: none;
	}
	@media (min-width: 1000px) {
		.lucky h4 {
			font-size: 0.8em;
			text-align: center;
		}
	}
	.lucky h4 span {
		color: #94d788;
		font-size: 42px;
		font-weight: bold;
		display: block;
		text-shadow:
			-0.01em -0.01em 0 #033f0b,
			-0.02em -0.02em 0 #033f0b,
			-0.03em -0.03em 0 #033f0b;
	}
	@media (min-width: 500px) {
		.lucky h4 span {
			font-size: 62px;
		}
	}
	@media (min-width: 1000px) {
		.lucky h4 span {
			display: inline-block;
		}
	}
	.lucky p {
		font-size: 24px;
		text-align: right;
		color: rgba(0, 0, 0, 0.9);
		margin-bottom: 32px;
	}
	@media (min-width: 0px) and (max-width: 499px) {
		.lucky p {
			font-size: 18px;
		}
	}
	.lucky .long {
		text-align: left;
		line-height: 1.3;
		max-width: 750px;
		margin-left: auto;
		margin-right: auto;
	}
	.lucky .info {
		font-size: 0.75em;
		opacity: 0.7;
	}
	.lucky .pop {
		color: rgba(255, 255, 255, 0.9);
		font-weight: bold;
		font-size: 32px;
	}
	.lucky .prizes {
		margin: 52px auto;
		list-style: none;
	}
	@media (min-width: 0px) and (max-width: 499px) {
		.lucky .prizes {
			font-size: 0.8em;
		}
	}
	.lucky .prizes li span {
		font-weight: bold;
		color: #94d788;
		text-shadow:
			-0.01em -0.01em 0 #033f0b,
			-0.02em -0.02em 0 #033f0b,
			-0.03em -0.03em 0 #033f0b;
	}
	.lucky .prizes li:nth-of-type(1) {
		font-size: 1.4em;
	}
	.lucky .homestead {
		display: block;
		margin: 6px auto;
	}
	@media (min-width: 500px) {
		.lucky .homestead {
			float: right;
			max-width: 50%;
			margin: 6px 0 3px 6px;
		}
	}
	.lucky .shamrock {
		width: 40%;
		position: absolute;
		top: 40px;
		right: 10px;
		z-index: 0;
	}
	@media (min-width: 1000px) {
		.lucky .shamrock {
			width: 30%;
			top: 228px;
			left: 50px;
		}
	}
</style>
