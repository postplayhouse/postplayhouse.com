<script lang="ts">
	import site, { ticketsAvailable } from "$data/site"
</script>

{#if ticketsAvailable()}
	<a href={site.ticketsLink} class="btn-p">Get Your Tickets Now!</a>
{:else}
	<button type="button" class="btn-p" disabled>Tickets Available Soon</button>
{/if}
