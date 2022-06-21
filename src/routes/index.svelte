<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  import site from "../data/site"

  const currentYear = new Date().getFullYear()
  const seasonYear = site.season

  export const load: Load = async (obj) => {
    if (currentYear !== seasonYear) return { props: { productions: [] } }

    const res = await obj.fetch(`/data/productions/${currentYear}.json`)
    const data = await res.json()

    if (res.status === 200) {
      return {
        props: {
          productions: data.productions,
        },
      }
    } else {
      return {
        status: res.status,
        error: new Error(
          `could not fetch /data/productions/${currentYear}.json`,
        ),
      }
    }
  }
</script>

<script lang="ts">
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

<div class="mb-32 p-2 max-w-2xl mx-auto space-y-4">
  <h1 class="h1">Cancelations: June 18–22</h1>
  <h2 class="h2">Re-opening on Friday!</h2>
  <div class="text-sm text-gray-500">
    Last update: {new Date(BUILD_TIME).toLocaleString()}
  </div>

  <p>
    Post Playhouse has canceled its performances from Saturday, June 18 through
    Wednesday, June 22. There was never a performance scheduled for Thursday,
    and <span class="font-bold"
      >we are pleased to announce that we will be going forward with our
      scheduled opening of Church Basement Ladies on Friday!</span
    >
    Please do check back here as our situation evolves.
  </p>

  <p>
    With audience health a top priority, this decision was made after positive
    Covid test results were detected in our company. We know that, while it may
    be an inconvenience for all, it is the best decision we can make for
    everyone at this time.
  </p>

  <p>
    If your performance is affected, you may call Post Playhouse to either
    exchange your tickets for another show, request a refund for your tickets or
    donate back to the Post Playhouse. Please be patient if your call is not
    answered immediately.
  </p>

  <p>
    We are not sure at this time when shows will resume. Check back here for the
    announcement of our re-opening.
  </p>

  <p class="font-bold">
    For those who would like to support Post Playhouse though these several days
    of cancelled performances, please
    <a class="link-green" href="/donate">visit our donations page</a>.
  </p>

  <p>Thank you for your patience and understanding!</p>
</div>

<div class="mb-32 p-2 max-w-2xl mx-auto">
  <Openings productions="{productions}" closingDate="2022-08-14">
    <img
      slot="seasonArtworkImage"
      src="/images/2022/full-season.jpg"
      alt="2022 season logos: The Sound of Music, Damn Yankees, Chuch Basement Ladies, Desperate Measures, and Something Rotten!"
    />
  </Openings>
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
