<script lang="ts">
  import Mailer from "$components/Mailer.svelte"
  import Markdown from "$components/Markdown.svelte"
  import Modal from "$components/Modal/Modal.svelte"

  import Announcement2024 from "./news/2023-10-17-announcing-2024-season/+page.md"

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

<a
  class="block mb-16 p-6 max-w-2xl mx-auto bg-green-100 shadow-md border border-green-400 hover:border-green-600 hover:shadow-lg hover:scale-105 transform-gpu transition-all group"
  href="/news/2023-10-10-new-artistic-team"
>
  <h1 class="h2 mb-2 group-hover:underline">Next Year's Artistic Team</h1>
  <Markdown
    source="{`Dear friends,

The Post Playhouse Board, staff, and artists are grateful to all of our supporters for a wonderful 2023 season. We were proud to give northwest Nebraska another summer of quality musical theatre entertainment thanks to the leadership of Andy Meyers, who served as producing artistic director.

As we look toward the 2024 season, the Post Playhouse is thrilled to announce two familiar faces are stepping up to leadership positions...`}"
  />

  <div class="link-green mt-2 text-right">Read more</div>
</a>

<div class="mb-12">
  <Announcement2024 />
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
