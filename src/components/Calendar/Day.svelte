<script lang="ts" context="module">
	import { asserted } from "$helpers"
	import type { Showing, SimpleDate } from "./calendarHelpers"
	import {
		makeDate,
		timeStrToMs,
		addMilliseconds,
		shortMonths,
		weekdays,
	} from "./calendarHelpers"

	const ARBITRARY_SPACER_CUT_OFF = timeStrToMs("17:00")

	// Not a daylight saving time date or any other crazy calendar day. Just need
	// `msFromMidnight` to be "normal"
	const genericDate = new Date(2020, 0, 1) // Jan 1, 2020

	function getShortTime(showing: Showing) {
		const showingTime = addMilliseconds(genericDate, showing.msFromMidnight)
		const hour24 = showingTime.getHours()
		const hour = hour24 > 12 ? hour24 - 12 : hour24
		const minute = ("0" + showingTime.getMinutes()).slice(-2)
		const meridiem = hour24 > 11 ? "p" : "a"
		return `${hour}${minute === "00" ? "" : minute}${meridiem}`
	}
</script>

<script lang="ts">
	type Props = {
		daySchedule?: Showing[]
		date: SimpleDate
	}

	let { date, daySchedule = [] }: Props = $props()

	const { month: monthNum, day: dayNum } = date
	const dt = makeDate(date)
	const monthShort = asserted(shortMonths[monthNum - 1])
	const dayLong = asserted(weekdays[dt.getDay()])
	const dayShort = dayLong.slice(0, 3)

	const includeSpacer =
		daySchedule.length === 1 &&
		asserted(daySchedule[0]).msFromMidnight > ARBITRARY_SPACER_CUT_OFF
</script>

<li
	class="day day-{dayNum} {dayLong.toLowerCase()}"
	class:dark="{daySchedule.length === 0}"
>
	<div class="day-wrapper">
		<div class="day-identifiers">
			<span class="day-name">
				<span class="full">{dayLong}</span>
				<span class="short">{dayShort}</span>
			</span>
			<div class="month-holder">
				<span class="month-name {monthShort.toLowerCase()}">{monthShort}</span>
			</div>
			<span class="mday">{dayNum}</span>
		</div>
		<ul class="day-content show-count-{daySchedule.length}">
			{#if includeSpacer}
				<div class="spacer"></div>
			{/if}
			{#each daySchedule as showing}
				<li class="showing evening show-{showing.color}">
					<span class="show-time">{getShortTime(showing)}</span>
					<span class="show-title">{showing.title}</span>
				</li>
			{/each}
		</ul>
	</div>
</li>
