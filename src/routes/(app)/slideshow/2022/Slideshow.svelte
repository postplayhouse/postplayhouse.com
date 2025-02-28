<script lang="ts">
	import { fade } from "svelte/transition"
	import Donors1000 from "./Donors1000.svelte"
	import Donors1 from "./Donors1.svelte"
	import Special from "./DonorsSpecial.svelte"
	import { onMount } from "svelte"
	import {
		initLocalAppVersion,
		refreshIfAppVersionOutdated,
	} from "$helpers/app-version"

	onMount(initLocalAppVersion)

	const shows = [Special, Donors1000, Donors1]

	let current = $state(0)
	let inc = $state(1)

	function nextShow() {
		inc += 1
		current = (current + 1) % shows.length

		const isSixthFullRun = (inc - 1) % (shows.length * 6) === 0

		if (isSixthFullRun) {
			refreshIfAppVersionOutdated()
		}
	}
</script>

<div class="fixed inset-0 dark:bg-black dark:text-white">
	{#if inc % 2 === 0}
		{@const ShowComponent = shows[inc % shows.length]}
		<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
			<ShowComponent onEventDone={() => nextShow()} />
		</div>
	{:else}
		{@const ShowComponent = shows[inc % shows.length]}
		<div transition:fade={{ duration: 1000 }} class="absolute inset-0">
			<ShowComponent onEventDone={() => nextShow()} />
		</div>
	{/if}
</div>
