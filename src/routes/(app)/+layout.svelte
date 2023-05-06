<script lang="ts">
  import { page } from "$app/stores"
  import Nav from "$components/Nav.svelte"
  import Header from "$components/Header.svelte"
  import Footer from "$components/Footer.svelte"
  import PersistentModal from "$components/Modal/PersistentModal.svelte"
  import { showDonateModal } from "$data/stores"
</script>

<PersistentModal on:close="{showDonateModal.toggle}" show="{$showDonateModal}">
  <h2 class="h2">Donate Now!</h2>

  <h3 class="h3">
    Help make our next season happen by donating to our Annual Fund!
  </h3>
  <p>
    Clicking the link below will take you to a site called Eleo Online, where
    you can complete your donation. Thank you so much for your support!
  </p>

  <div class="text-center mt-4">
    <a
      href="https://www.eleoonline.net/Pages/WebForms/Mobile/ShowFormMobile.aspx?id=f790c257-b67f-4508-9ff9-0fc3a16f04d2&linkto=670"
      target="_blank"
      rel="noopener noreferrer"
      class="btn p-4 px-6 inline-block"
    >
      Visit our donation form</a
    >
  </div>
</PersistentModal>

<Header />
<Nav activePath="{$page.url.pathname}" />

<main class="relative m-auto py-8 px-2 sm:px-8">
  <slot />
</main>

<Footer />

<style>
  main {
    max-width: 56em;
  }
</style>
