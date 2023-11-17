<script lang="ts">
  import DonateBtn from "$components/DonateBtn.svelte"
  import Mailer from "$components/Mailer.svelte"
  import Modal from "$components/Modal/Modal.svelte"
  import Openings from "$components/OpeningAnnouncements.svelte"
  import { isToday } from "date-fns"

  export let data

  const { productions } = data

  $: showMailingList = false

  function toggleMailingList() {
    showMailingList = !showMailingList
  }
</script>

<svelte:head>
  <title>Post Playhouse</title>

  <meta
    name="description"
    content="Post Playhouse is Northwestern Nebraska's favorite live theatre company"
  />
  <link rel="canonical" href="https://postplayhouse.com" />

  <!-- Facebook Meta Tags -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Post Playhouse" />
  <meta
    property="og:description"
    content="Post Playhouse is Northwestern Nebraska's favorite live theatre company"
  />
</svelte:head>

{#if isToday(new Date("2023-11-28T00:00:00.000"))}
  <div class="block mb-16 p-6 max-w-2xl mx-auto">
    <img
      src="/images/2024/giving-tuesday.jpg"
      alt="Giving Tuesday logo above a moment from Post's production of The Music Man."
    />

    <p class="mt-4">
      It’s Giving Tuesday! On this international day of giving, join us and the
      millions of others worldwide by donating! You can make a gift to Post
      Playhouse today! #celebrategenerosity
    </p>

    <DonateBtn />
  </div>
{/if}

<div class="mb-16 p-2 max-w-2xl mx-auto">
  <Openings productions="{productions}" closingDate="2024-08-11">
    <div slot="seasonArtworkImage" class="w-full max-w-2xl m-auto">
      <img
        src="/images/2024/full-season.jpg"
        alt="2024 season logos: The Wizard of Oz, Honky Tonk Laundry, Kiss Me Kate, The SpongeBob Musical, Jersey Boys"
      />
    </div>

    <div slot="seasonSponsors">
      <div class="text-center mb-4 font-bold">
        Special thanks to our Season Sponsors:
      </div>
      <div class="grid grid-cols-2 gap-8 items-center max-w-[24rem] m-auto">
        <img
          alt="Logo for Chadron State College"
          src="/images/sponsors/csc.png"
        />
        <img
          alt="Logo for Security First Bank"
          src="/images/sponsors/security-first-bank.png"
        />
        <img
          alt="Logo for Casey Peterson Financial"
          src="/images/sponsors/casey-peterson-financial.png"
          class="col-span-2"
        />
      </div>
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
