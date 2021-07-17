<script lang="ts">
  /**
   * Like the regular modal, except the showing and hiding is all done via the
   * `show` prop. And the contents of the modal are always loaded into the DOM.
   * This allows forms to not lose data after closing, etc.
   */
  import debounce from "lodash/debounce.js"
  import { createEventDispatcher } from "svelte"

  import Freeze from "../Freeze.svelte"
  import { lifecycle } from "./modal"
  import ModalBase from "./ModalBase.svelte"

  export let show = true

  const dispatch = createEventDispatcher()

  let ref: { current: HTMLDivElement } = { current: null }

  lifecycle(ref, "persistent-modal")

  let transitionedOut = false
  const delayedTransition = debounce(() => (transitionedOut = !show), 200)

  $: {
    if (show) {
      transitionedOut = false
    } else {
      delayedTransition()
    }
  }
</script>

{#if show}
  <Freeze />
{/if}

<!-- the parent is hidden, but the child with the `ref` will be appended
elsehwere in the DOM via `onMount` -->
<div class="hidden">
  <div
    class="transition-opacity duration-200 {show ? 'opacity-100' : 'opacity-0'}
    "
    bind:this="{ref.current}"
  >
    <ModalBase transitionedOut="{transitionedOut}" dispatch="{dispatch}">
      <slot />
    </ModalBase>
  </div>
</div>
