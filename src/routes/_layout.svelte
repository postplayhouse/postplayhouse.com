<script>
  import Nav from "../components/Nav.svelte"
  import Header from "../components/Header.svelte"
  import Footer from "../components/Footer.svelte"
  import Modal from "../components/Modal.svelte"
  import { showDonateModal } from '../data/stores'

  export let segment
</script>

{#if $showDonateModal}
  <Modal on:close={showDonateModal.toggle}>

    <h2 class="h2">Donate Now!</h2>

    <iframe title="Donate to Post Playhouse" name='ELEOForm' id='ELEOForm' style='width:100%;min-width:320px;max-width:900px;min-height:1000px;border-width:0px;border-style:none;' scrolling='no' src='https://www.eleoonline.net/Pages/WebForms/Mobile/ShowFormMobile.aspx?id=f790c257-b67f-4508-9ff9-0fc3a16f04d2&linkto=670' ></iframe>
  </Modal>
{/if}



<style>
  main {
    max-width: 56em;
  }
</style>

<Header />
<Nav {segment} />

<main class="relative m-auto py-8 px-2 sm:px-8">
  <slot />
</main>

<Footer />
