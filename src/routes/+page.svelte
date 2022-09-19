<script lang="ts" context="module">
  throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

  // import type { Load } from "@sveltejs/kit"
  // import site from "../data/site"

  // const currentYear = new Date().getFullYear()
  // const seasonYear = site.season

  // export const load: Load = async (obj) => {
  //   if (currentYear !== seasonYear) return { props: { productions: [] } }

  //   const res = await obj.fetch(`/data/productions/${currentYear}.json`)
  //   const data = await res.json()

  //   if (res.status === 200) {
  //     return {
  //       props: {
  //         productions: data.productions,
  //       },
  //     }
  //   } else {
  //     return {
  //       status: res.status,
  //       error: new Error(
  //         `could not fetch /data/productions/${currentYear}.json`,
  //       ),
  //     }
  //   }
  // }
</script>

<script lang="ts">
  throw new Error("@migration task: Add data prop (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292707)");

  import Mailer from "../components/Mailer.svelte"
  import Modal from "../components/Modal/Modal.svelte"
  import Openings from "../components/OpeningAnnouncements.svelte"

  export let productions: Production[]

  $: showMailingList = false

  function toggleMailingList() {
    showMailingList = !showMailingList
  }
</script>

<svelte:head>
  <title>Post Playhouse</title>
</svelte:head>

<div class="mb-32 p-2 max-w-2xl mx-auto">
  <h3 class="h1 my-8">Thank you for a wonderful season!</h3>

  <p class="text-3xl my-8">
    We were delighted to bring you a summer season full of entertainment!
  </p>

  <div class="my-4 space-y-4 text-lg">
    <p>
      The Board of Directors of the Post Playhouse wants to thank everyone
      involved in the Post for another great year. 2022 was a remarkable
      “comeback” season that everyone should be proud of.
    </p>
    <p>
      We particularly want to thank Tom Ossowski for <a
        href="/news/2022-08-14-tom-says-goodbye"
        class="link-green">his many years of service</a
      >
      to the Post Playhouse. His leadership, artistic approach, and positive attitude
      elevated the Post Playhouse to what it is today. For that, we are eternally
      grateful.
    </p>
    <p>
      The Board now turns its attention to the 2023 season, as well as <a
        class="link-green"
        href="/jobs">hiring a new artistic director</a
      > to continuing our mission. See you next season!
    </p>
  </div>
</div>

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

<!-- Sapper is no good at generating pages that have no link so we have to add these -->
<div class="hidden"><a href="/news">#</a> <a href="/policies">#</a></div>
