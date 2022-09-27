<script lang="ts">
  import site from "$data/site"
</script>

{#if site.ticketsAvailable}
  <a href="{site.ticketsLink}" class="btn-p">Get Your Tickets Now!</a>
{:else}
  <button type="button" class="btn-p" disabled>Tickets Available Soon</button>
{/if}
