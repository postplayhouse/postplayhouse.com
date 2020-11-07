<script>
  /**
   * Like the regular modal, except the showing and hiding is all done via the
   * `show` prop. And the contents of the modal are always loaded into the DOM.
   * This allows forms to not lose data after closing, etc.
   */
  import debounce from "lodash/debounce"
  import { onMount, onDestroy, createEventDispatcher } from "svelte"

  import Freeze from "./Freeze.svelte"

  export let show = true

  let ref
  let portal

  let transitionedOut = false
  const delayedTransition = debounce(() => (transitionedOut = !show), 200)

  $: {
    if (show) {
      transitionedOut = false
    } else {
      delayedTransition()
    }
  }

  const dispatch = createEventDispatcher()

  onMount(() => {
    portal = document.createElement("div")
    portal.className = "persistent-modal"
    document.body.appendChild(portal)
    portal.appendChild(ref)
  })

  onDestroy(() => {
    try {
      document.body.removeChild(portal)
    } catch (_) {}
  })
</script>

<style>
  .my-bg {
    background-color: rgba(0, 0, 0, 0.4);
  }

  .disappear {
    left: -9999rem;
  }
</style>

{#if show}
  <Freeze />
{/if}

<!-- the parent is hidden, but the child with the `ref` will be appended
elsehwere in the DOM via `onMount` -->
<div class="hidden">
  <div
    class="fixed flex justify-center items-center shadow-md my-bg overflow-auto
    transition-opacity duration-200 {show ? 'opacity-100' : 'opacity-0'}
    {transitionedOut ? 'disappear' : 'inset-0'}"
    bind:this="{ref}"
    on:click|self="{() => dispatch('close')}">
    <section
      class="absolute inset-2 block sm:inset-auto sm:top-4 mb-4 sm:w-128
      sm:min-h-64 p-4 bg-white border-green-600 border-solid border-4">
      <button
        class="btn py-1 px-2 leading-none absolute top-0 right-0 -mt-3 -mr-3
        z-10"
        on:click="{() => dispatch('close')}">
        Close
      </button>

      <slot />
    </section>
  </div>
</div>
