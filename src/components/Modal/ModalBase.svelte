<script lang="ts">
  export let transitionedOut = false
  export let dispatch: (evtName: string) => void
</script>

<style>
  .my-bg {
    background-color: rgba(0, 0, 0, 0.4);
  }

  .disappear {
    left: -9999rem;
  }
</style>

<div
  class="fixed shadow-md my-bg overflow-y-auto xs:p-4
    {transitionedOut ? 'disappear' : 'inset-0'}"
  on:click|self="{() => dispatch('close')}">
  <section
    class="absolute bg-white border-green-600 border-solid block px-4 py-6
      border-6 inset-0 bottom-auto min-h-full
      xs:relative xs:mx-auto xs:border-4 xs:inset-auto xs:min-h-0 xs:max-w-lg
      ">
    <button
      class="btn py-1 px-2 leading-none top-0 right-0 z-10
        fixed mt-4 mr-4
        xs:absolute xs:mt-2 xs:mr-2"
      on:click="{() => dispatch('close')}">
      Close
    </button>

    <slot />
  </section>
</div>
