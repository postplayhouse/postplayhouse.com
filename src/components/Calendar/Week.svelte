<script lang="ts">
  import type { Showing } from "./calendarHelpers"

  import Day from "./Day.svelte"

  export let days: Array<{
    date: { year: number; month: number; day: number }
    showings: Showing[]
  }>

  export let padStartCount = 0
</script>

<ul class="week">
  {#if padStartCount}
    <li class="day padding" colspan="{padStartCount}">
      <slot />
    </li>
  {/if}
  {#each days as day}
    <Day date="{day.date}" daySchedule="{day.showings}" />
  {/each}
</ul>
