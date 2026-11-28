<script lang="ts">
	// Unlinked page for checking the box office donation embed in production.
	// `?host=staging` frames the staging box office instead.
	import { onMount } from "svelte"
	import DonateEmbedBtn from "$components/DonateEmbed/DonateEmbedBtn.svelte"
	import {
		donateEmbedUrl,
		parseDonateEmbedHost,
		type DonateEmbedHost,
	} from "$components/DonateEmbed/donate-embed"

	let host: DonateEmbedHost = $state("production")
	let doneReceived = $state(false)

	onMount(() => {
		host = parseDonateEmbedHost(
			new URLSearchParams(location.search).get("host"),
		)
	})
</script>

<svelte:head>
	<title>Donation embed test | Post Playhouse</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="via-markdown mx-auto max-w-2xl">
	<h1 class="h1">Donation embed test</h1>
	<p>
		This page is not linked anywhere. It checks the box office donation form
		inside a modal before the site's Donate buttons switch to it.
	</p>
	<p>Framing: <code>{donateEmbedUrl(host)}</code></p>

	<DonateEmbedBtn {host} onDone={() => (doneReceived = true)} />

	{#if doneReceived}
		<p data-testid="done-received">The box office reported a completed gift.</p>
	{/if}
</div>
