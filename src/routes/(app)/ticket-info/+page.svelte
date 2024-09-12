<script lang="ts">
	import SeatingChart from "$components/SeatingChart.svelte"
	import TicketPolicy from "$components/TicketPolicy.md"
	import Mailer from "$components/Mailer.svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import site, { ticketsAvailable } from "$data/site"
	import ParkingNotice from "$components/ParkingNotice.svelte"

	let { data } = $props()

	const { productions } = data

	let showMailingList = $state(false)

	function toggleMailingList() {
		showMailingList = !showMailingList
	}
</script>

<div class="via-markdown">
	<p>
		Ticket sales for every summer season begin in the fall. Check back here for
		on-sale date announcements, or <button
			type="button"
			class="link-green"
			onclick="{toggleMailingList}">subscribe to our newsletter</button
		>.
	</p>

	{#if showMailingList}
		<Modal on:close="{toggleMailingList}">
			<Mailer />
		</Modal>
	{/if}

	{#if ticketsAvailable()}
		<a class="link-green" href="{site.ticketsLink}">Buy yours now!</a><br />
	{/if}

	<div class="mt-2">
		Or email us at
		<a class="link-green" href="mailto:tickets@postplayhouse.com"
			>tickets@postplayhouse.com</a
		><br />

		Call our box office at
		<a class="x" href="{site.boxOfficePhoneLink}">
			{site.boxOfficePhone}
		</a>
	</div>

	<h2 class="h2 mt-4 mb-2">Ticket Prices</h2>

	<table
		class="[&_th]:font-normal [&_th,&_td]:h-10"
		cellspacing="0"
		cellpadding="0"
	>
		<thead class="[&_th]:px-4 [&_th]:py-2">
			<tr class="border-b border-gray-400">
				<th class=""></th>
				<th class="">Single Ticket</th>
				<th class="">4-Show Subscription</th>
				<th class="">5-Show Subscription</th>
			</tr>
		</thead>
		<tbody>
			<tr class="border-b">
				<th class="text-left w-[9.5rem]">Adult</th>
				<td class="text-center">$33</td>
				<td class="text-center">$106</td>
				<td class="text-center">$132</td>
			</tr>
			<tr class="border-b">
				<th class="text-left w-[9.5rem]"
					>Senior <span class="text-xs">(65+)</span></th
				>
				<td class="text-center">$28</td>
				<td class="text-center">$88</td>
				<td class="text-center">$110</td>
			</tr>
			<tr class="border-b">
				<th class="text-left w-[9.5rem]"
					>Youth <span class="text-xs">(12-)</span></th
				>
				<td class="text-center">$22</td>
				<td class="text-center">$71</td>
				<td class="text-center">$88</td>
			</tr>
			<tr>
				<th class="text-left w-[9.5rem]"
					>Group <span class="text-xs">(25 or more)</span></th
				>
				<td class="text-center">$28</td>
			</tr>
		</tbody>
	</table>

	<h3 class="h3 mt-4 mb-2">Group Rates</h3>

	<p>
		Groups of 25 or more may purchase tickets at the rate noted above. Tickets
		may be added to a group sale (if seats are available) up to show date but
		are never reduced or refunded. The Post Playhouse cannot be responsible for
		unused group tickets. Group rate tickets can be purchased online by
		selecting 25 or more seats. Or, if you prefer, you can email us for group
		rate ticket needs at
		<a class="link-green" href="mailto:tickets@postplayhouse.com">
			tickets@postplayhouse.com
		</a>
		or call our box office at
		<a class="x" href="{site.boxOfficePhoneLink}">{site.boxOfficePhone}</a>.
	</p>

	<h2 id="subscriptions" class="h2 mt-4 mb-2">Season Subscriptions</h2>

	<p>
		Subscriptions are the best way to see what Post Playhouse has to offer each
		summer! With a Season Subscription, you get drastically discounted tickets
		on 4 or 5 different productions of your choosing. And since you don't have
		to pick your dates or seats at the time of purchase, they make great gifts.
	</p>

	<p class="mt-2">
		This year, you'll choose from the following shows to fill out your season
		subscription:
	</p>

	<ol class="my-2">
		{#each productions as production}
			<li>{production.title}</li>
		{/each}
	</ol>

	<p class="bg-gray-200 dark:bg-gray-200/20 border p-4 my-4">
		<strong>Subscribers:</strong> After purchasing your subscription, you can
		reserve seats to any 4 or 5 <em>different</em> productions by emailing us at
		<a href="mailto:tickets@postplayhouse.com">tickets@postplayhouse.com</a>,
		calling our box office at
		<a class="x" href="{site.boxOfficePhoneLink}">{site.boxOfficePhone}</a>, or
		using the online system.
		<strong>
			Though Season Subscriptions are very flexible, seats are still based on
			availability, so please make your reservations as soon as you can. We
			usually sell out toward the end of the season!
		</strong>
	</p>

	<h2 class="h2 mt-4 mb-2">Seating Chart</h2>

	<SeatingChart />

	<TicketPolicy />

	<ParkingNotice />
</div>
