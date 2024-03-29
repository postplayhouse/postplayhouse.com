<script lang="ts">
	import { site } from "$data/site"

	// TODO: try to resolve this import so that the data is available for prerendering
	const SponsorPlate = import(
		// Cannot use aliases when doing this dynamic import
		`./${site.season}.svelte`
	).then((x) => x.default)
</script>

{#await SponsorPlate then ThisYearSponsors}
	<slot name="beforeSponsors" />
	<svelte:component this="{ThisYearSponsors}" />
	<slot name="afterSponsors" />
{/await}
