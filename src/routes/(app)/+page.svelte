<script lang="ts">
  import Mailer from "$components/Mailer.svelte"
  import Modal from "$components/Modal/Modal.svelte"
  import Openings from "$components/OpeningAnnouncements.svelte"
  import SeasonAnnounced from "./news/2022-12-01-announcing-2023-season/+page.svelte"
  import Cabaret from "./news/2023-07-20-cabaret-announcement/+page.md"

  import MaybeImage from "$components/MaybeImage.svelte"
  export let data

  const { productions } = data

  $: showMailingList = false

  function toggleMailingList() {
    showMailingList = !showMailingList
  }
</script>

<svelte:head>
  <title>Post Playhouse</title>
</svelte:head>

<div class="mb-16 p-2 max-w-2xl mx-auto">
  <Cabaret />
</div>

<div class="mb-32 p-2 max-w-2xl mx-auto">
  <Openings productions="{productions}" closingDate="2023-08-13">
    <div slot="seasonArtworkImage" class="w-full max-w-2xl m-auto">
      <img
        src="/images/2023/full-season.jpg"
        alt="2023 season logos: Leader of the Pack, Clue the Musical, Joseph and the Amazing Technicolor Dreamcoat, You're a Good Man Charlie Brown, The Spitfire Grill"
      />
    </div>
  </Openings>
</div>

<div class="md:flex flex-row-reverse items-stretch">
  <section class=" mb-2">
    <a href="/donate">
      <img
        alt="actors making a heart with their arms"
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
