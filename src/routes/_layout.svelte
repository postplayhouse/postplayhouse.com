<script>
  import Nav from "../components/Nav.svelte"
  import Header from "../components/Header.svelte"
  import Footer from "../components/Footer.svelte"

  export let segment
</script>

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
