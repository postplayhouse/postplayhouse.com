<script lang="ts">
  import { fade } from "svelte/transition"
  import Donors1000 from "./Lobby2023/Annual1000.svelte"
  import Donors1 from "./Lobby2023/Annual1.svelte"
  import Special from "./Lobby2023/Special.svelte"
  import { onMount } from "svelte"
  import {
    initLocalAppVersion,
    refreshIfAppVersionOutdated,
  } from "$helpers/app-version"

  onMount(initLocalAppVersion)

  const shows = [Special, Donors1000, Donors1]

  let current = 0
  let inc = 1

  function nextShow() {
    inc += 1
    current = (current + 1) % shows.length

    const isSixthFullRun = (inc - 1) % (shows.length * 6) === 0

    if (isSixthFullRun) {
      refreshIfAppVersionOutdated()
    }
  }
</script>

<div class="fixed inset-0 bg-white">
  {#if inc % 2 === 0}
    <div
      transition:fade="{{ duration: 1000 }}"
      class="absolute inset-0 bg-white"
    >
      <svelte:component this="{shows[current]}" on:done="{() => nextShow()}" />
    </div>
  {:else}
    <div
      transition:fade="{{ duration: 1000 }}"
      class="absolute inset-0 bg-white"
    >
      <svelte:component this="{shows[current]}" on:done="{() => nextShow()}" />
    </div>
  {/if}

  <div
    class="absolute bottom-0 w-full p-8 bg-white/50 flex justify-center items-center text-red-500 font-bold text-[4vw]"
  >
    This is a copy of last year's slideshow, but you are on the correct page for
    2023. This will be updated as soon as possible.
  </div>
</div>
