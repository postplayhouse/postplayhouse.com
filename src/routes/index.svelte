<script>
  import Mailer from "../components/Mailer.svelte"
  import Modal from "../components/Modal.svelte"

  $: showMailingList = false

  function toggleMailingList() {
    showMailingList = !showMailingList
  }
</script>

<svelte:head>
  <title>Post Playhouse</title>
</svelte:head>

<h1 class="font-uber text-4xl">Great success!</h1>

<section
  class="bg-green-200 p-3 cursor-pointer hover:bg-green-300"
  on:click={toggleMailingList}>
  <header class="text-xl">Join our mailing list</header>
  <p>Stay informed about what’s happening at Post Playhouse</p>
</section>

{#if showMailingList}
  <Modal on:close={toggleMailingList}>
    <Mailer />
  </Modal>
{/if}
