<script lang="ts">
  import { fade } from "svelte/transition"
  import Donors1000 from "./Lobby2023/Annual1000.svelte"
  import Donors1 from "./Lobby2023/Annual1.svelte"
  import { afterUpdate, onMount } from "svelte"
  import {
    initLocalAppVersion,
    refreshIfAppVersionOutdated,
  } from "$helpers/app-version"
  import { positiveIntStore } from "./Lobby2023/helpers"

  onMount(initLocalAppVersion)

  const showsAndTimers = [
    [Donors1000, positiveIntStore(8), "Large Donations"],
    [Donors1, positiveIntStore(10), "Regular Donations"],
  ] as const

  const shows = showsAndTimers.map(([show]) => show)
  const timers = showsAndTimers.map(([_, timer]) => timer)
  const showNames = showsAndTimers.map(([_, __, name]) => name)

  let inc = 0

  function nextShow() {
    inc += 1

    const isSixthFullRun = inc % (shows.length * 6) === 0

    if (isSixthFullRun) {
      refreshIfAppVersionOutdated()
    }
  }

  let resetCount = 0

  $: currentDurationMultiplier = timers[
    inc % timers.length
  ] as (typeof timers)[number]

  function onKeyDown(event: KeyboardEvent) {
    if (event.repeat) return

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        currentDurationMultiplier.increment()
        resetCount = resetCount + 1
        visible = true
        break
      case "ArrowUp":
        event.preventDefault()
        currentDurationMultiplier.decrement()
        resetCount = resetCount + 1
        visible = true
        break
      case "ArrowLeft":
        event.preventDefault()
        if (inc === 0) {
          resetCount = resetCount + 1
        } else {
          inc -= 1
        }
        break
      case "ArrowRight":
        event.preventDefault()
        inc += 1
        break
    }
  }

  let visible = true

  afterUpdate(() => (visible = false))
</script>

<svelte:window on:keydown="{onKeyDown}" />

{#key resetCount}
  <div class="fixed inset-0 bg-white">
    {#if inc % 2 === 0}
      <div
        transition:fade="{{ duration: 1000 }}"
        class="absolute inset-0 bg-white"
      >
        <svelte:component
          this="{shows[inc % shows.length]}"
          durationMultiplier="{$currentDurationMultiplier}"
          on:done="{() => nextShow()}"
        />
      </div>
    {:else}
      <div
        transition:fade="{{ duration: 1000 }}"
        class="absolute inset-0 bg-white"
      >
        <svelte:component
          this="{shows[inc % shows.length]}"
          durationMultiplier="{$currentDurationMultiplier}"
          on:done="{() => nextShow()}"
        />
      </div>
    {/if}
  </div>
  {#if visible}
    <div
      out:fade="{{ duration: 1000 }}"
      class="fixed inset-0 flex justify-center items-center"
    >
      <span
        class="bg-black/50 text-white font-bold rounded-lg px-2 py-1 text-[6vw]"
      >
        {showNames[inc % showNames.length]} Speed: {20 -
          ($currentDurationMultiplier - 1)}
      </span>
    </div>
  {/if}
{/key}
