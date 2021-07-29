<script lang="ts">
  import "../app.postcss"
  import { page } from "$app/stores"
  import Nav from "../components/Nav.svelte"
  import Header from "../components/Header.svelte"
  import Footer from "../components/Footer.svelte"
  import PersistentModal from "../components/Modal/PersistentModal.svelte"
  import { showDonateModal } from "../data/stores"
</script>

<style>
  main {
    max-width: 56em;
  }
</style>

<PersistentModal on:close="{showDonateModal.toggle}" show="{$showDonateModal}">
  <h2 class="h2">Donate Now!</h2>

  <h3 class="h3">
    Help make our next season happen by donating to our Annual Fund!
  </h3>

  <iframe
    title="Donate to Post Playhouse"
    name="ELEOForm"
    id="ELEOForm"
    style="width:100%;max-width:900px;min-height:1000px;border-width:0px;border-style:none;"
    scrolling="no"
    src="https://www.eleoonline.net/Pages/WebForms/Mobile/ShowFormMobile.aspx?id=f790c257-b67f-4508-9ff9-0fc3a16f04d2&linkto=670"
  ></iframe>
</PersistentModal>

<Header />
<Nav activePath="{$page.path}" />

<main class="relative m-auto py-8 px-2 sm:px-8">
  <slot />
</main>

<Footer />
