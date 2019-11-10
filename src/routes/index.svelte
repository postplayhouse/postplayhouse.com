<script>
  import Mailer from "../components/Mailer.svelte"
  import Modal from "../components/Modal.svelte"

  import Feature from "./news/2019-09-22-announcing-2020-season.md"

  $: showMailingList = false

  function toggleMailingList() {
    showMailingList = !showMailingList
  }
</script>

<svelte:head>
  <title>Post Playhouse</title>
</svelte:head>

<h1 class="font-uber text-4xl">Great success!</h1>

<div class="my-8">
  <Feature excerpt={true} />
</div>

<div class="md:flex flex-row-reverse items-stretch">
  <section class=" mb-2">
    <a href="/donations">
      <img
        alt="actors making a heart with thier hands"
        src="/images/perennials/donations.jpg" />
    </a>
  </section>

  <div class="md:flex flex-col md:mr-2">
    <section
      class="bg-green-200 p-3 cursor-pointer hover:bg-green-300 flex-initial
      mb-2"
      on:click={toggleMailingList}>
      <header class="text-xl">Join our mailing list</header>
      <p>Stay informed about what’s happening at Post Playhouse</p>
    </section>

    <section class="bg-green-200 p-3 flex-1 mb-2 flex flex-col">
      <header class="text-xl">Stay connected with post</header>
      <div class="flex flex-wrap justify-around items-center flex-1">
        <a
          class="block w-24 h-24 md:w-16 md:h-16 p-2 hover:bg-green-300"
          href="http://facebook.com/post.playhouse">
          <img src="/images/facebook-logo.svg" alt="Facebook logo" />
        </a>
        <a
          class="block w-24 h-24 md:w-16 md:h-16 p-2 hover:bg-green-300"
          href="http://twitter.com/postplayhouse">
          <img src="/images/twitter-bird.svg" alt="Twitter logo" />
        </a>
      </div>

    </section>
  </div>

</div>

{#if showMailingList}
  <Modal on:close={toggleMailingList}>
    <Mailer />
  </Modal>
{/if}
