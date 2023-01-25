<script lang="ts">
  import Mailer from "$components/Mailer.svelte"
  import Modal from "$components/Modal/Modal.svelte"
  // import Openings from "$components/OpeningAnnouncements.svelte"
  import SeasonAnnounced from "./news/2022-12-01-announcing-2023-season/+page.svelte"

  import type { PageData } from "./$types"
  export let data: PageData

  const { productions } = data

  $: showMailingList = false

  function toggleMailingList() {
    showMailingList = !showMailingList
  }
</script>

<svelte:head>
  <title>Post Playhouse</title>
</svelte:head>

<a
  class="block mb-16 p-6 max-w-2xl mx-auto bg-green-100 shadow-md border border-green-400 hover:border-green-600 hover:shadow-lg hover:scale-105 transform-gpu transition-all group"
  href="/jobs"
>
  <h1 class="h2 mb-2 group-hover:underline">Announcing auditions for 2023!</h1>
  <p>
    Seeking professional actors from across the country. Local actor auditions
    will be announced soon as well!
  </p>
  <div class="link-green mt-2 text-right">Read the entire job posting</div>
</a>

<a
  class="block mb-16 p-6 max-w-2xl mx-auto bg-green-100 shadow-md border border-green-400 hover:border-green-600 hover:shadow-lg hover:scale-105 transform-gpu transition-all group"
  href="/news/2023-01-13-new-artistic-director-announced"
>
  <h1 class="h2 mb-2 group-hover:underline">
    Meet Our New Artistic Director... <br />Andy Meyers!
  </h1>
  <p>
    “I love being part of a tight knit community and just cannot wait to be part
    of the community in Northwest Nebraska!”
  </p>

  <div class="link-green mt-2 text-right">Read the entire announcement</div>
</a>
<div class="mb-32 p-2 max-w-2xl mx-auto">
  <h1 class="h1 mb-6">2023 Season tickets on sale now!</h1>
  <SeasonAnnounced />
</div>

<!-- <div class="mb-32 p-2 max-w-2xl mx-auto">
  <Openings productions="{productions}" closingDate="2023-08-13" />
</div> -->

<div class="md:flex flex-row-reverse items-stretch">
  <section class=" mb-2">
    <a href="/donate">
      <img
        alt="actors making a heart with thier hands"
        src="/images/perennials/donations.jpg"
      />
    </a>
  </section>

  <div class="md:flex flex-col md:mr-2">
    <section
      class="bg-green-200 p-3 flex-initial
      mb-2"
    >
      <header class="text-xl">Join our mailing list</header>
      <p>Stay informed about what’s happening at Post Playhouse</p>
      <button on:click="{toggleMailingList}" class="btn px-4 py-2"
        >Join now!</button
      >
    </section>

    <section class="bg-green-200 p-3 flex-1 mb-2 flex flex-col">
      <header class="text-xl">Stay connected with Post</header>
      <div class="flex flex-wrap justify-around items-center flex-1">
        <a
          class="block w-24 h-24 md:w-16 md:h-16 p-2 hover:bg-green-300"
          href="http://facebook.com/post.playhouse"
        >
          <img src="/images/facebook-logo.svg" alt="Facebook logo" />
        </a>
        <a
          class="block w-24 h-24 md:w-16 md:h-16 p-2 hover:bg-green-300"
          href="http://twitter.com/postplayhouse"
        >
          <img src="/images/twitter-bird.svg" alt="Twitter logo" />
        </a>
      </div>
    </section>
  </div>
</div>

{#if showMailingList}
  <Modal on:close="{toggleMailingList}">
    <Mailer />
  </Modal>
{/if}
