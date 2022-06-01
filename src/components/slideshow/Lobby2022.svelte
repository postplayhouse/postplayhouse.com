<script lang="ts">
  import { fade } from "svelte/transition"
  import Donors1000 from "./Lobby2022/Annual1000.svelte"
  import Donors1 from "./Lobby2022/Annual1.svelte"
  import Special from "./Lobby2022/Special.svelte"
  import Actors from "./Lobby2022/Actors.svelte"
  import { onMount } from "svelte"
  import {
    initLocalAppVersion,
    refreshIfAppVersionOutdated,
  } from "../../helpers/app-version"

  onMount(initLocalAppVersion)

  export let actors: YamlPerson[]

  const shows = [Actors, Special, Donors1000, Donors1]

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
      <svelte:component
        this="{shows[current]}"
        on:done="{() => nextShow()}"
        actors="{actors}"
      />
    </div>
  {:else}
    <div
      transition:fade="{{ duration: 1000 }}"
      class="absolute inset-0 bg-white"
    >
      <svelte:component
        this="{shows[current]}"
        on:done="{() => nextShow()}"
        actors="{actors}"
      />
    </div>
  {/if}
</div>
