<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte"
  import { fade } from "svelte/transition"
  let ref
  let portal

  const dispatch = createEventDispatcher()

  onMount(() => {
    portal = document.createElement("div")
    portal.className = "modal"
    document.body.appendChild(portal)
    portal.appendChild(ref)
  })

  onDestroy(() => {
    document.body.removeChild(portal)
  })
</script>

<style>
  .my-bg {
    background-color: rgba(0, 0, 0, 0.4);
  }
</style>

<svelte:head>
  <style>
    #sapper {
      filter: blur(0.5rem);
    }
    body {
      overflow: hidden;
    }
  </style>
</svelte:head>
<!-- the parent is hidden, but the child with the `ref` will be appended
elsehwere in the DOM via `onMount` -->
<div class="hidden">
  <div
    class="fixed inset-0 flex justify-center items-center shadow-md my-bg
    overflow-auto"
    bind:this={ref}
    transition:fade={{ duration: 100 }}
    on:click|self={() => dispatch('close')}>
    <section
      class="absolute inset-2 block sm:inset-auto sm:top-4 mb-4 sm:w-128
      sm:min-h-64 p-4 bg-white border-green-600 border-solid border-4">

      <button
        class="btn py-1 px-2 leading-none absolute top-0 right-0 -mt-3 -mr-3
        z-10"
        on:click={() => dispatch('close')}>
        Close
      </button>

      <slot />

    </section>
  </div>
</div>
