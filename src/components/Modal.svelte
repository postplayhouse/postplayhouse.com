<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte"
  import { fade } from "svelte/transition"

  import Freeze from "./Freeze.svelte"
  import { lifecycle } from "./Modal/modal"
  import ModalBase from "./Modal/ModalBase.svelte"

  const dispatch = createEventDispatcher()

  let ref: { current: HTMLDivElement } = { current: null }

  lifecycle(ref, "modal")
</script>

<Freeze />

<!-- the parent is hidden, but the child with the `ref` will be appended
elsehwere in the DOM via `onMount` -->
<div class="hidden">
  <div bind:this="{ref.current}" transition:fade="{{ duration: 200 }}">
    <ModalBase dispatch="{dispatch}">
      <slot />
    </ModalBase>
  </div>
</div>
