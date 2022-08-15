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

<div class="mb-32 p-2 max-w-2xl mx-auto">
  <h3 class="h1 my-8">Thank you for a wonderful season!</h3>

  <p class="text-3xl my-8">
    We were delighted to bring you a summer season full of entertainment!
  </p>

  <h3 class="h1">
    A Special Message from <span class="whitespace-nowrap">Tom Ossowski</span>
  </h3>

  <div class="my-4 space-y-4 text-lg">
    <p>Dear Friends,</p>

    <p>
      Thank you all for an amazing post-Covid come back 2022 season. I have been
      Producing Artistic Director for the past 16 years and I’m proud of the
      work we have done at the Post Playhouse presenting theatre in the
      Panhandle of Nebraska. It has always been my goal to harness the power of
      live theatre to bring people in our communities together and I am so
      pleased to have successfully led Post Playhouse in that mission all these
      years. I cherish the many friendships here in Northwest Nebraska and have
      been very moved by the magic we have made together on the Post Playhouse
      stage.
    </p>

    <p>
      It is with mixed emotions that I am moving on after this summer.
      Everything in life has a season and this has been a wonderful season of my
      life. However, due to shifting long-term strategy planning within the
      organization, I have decided to hand off the reins to a new Artistic
      Director to usher Post Playhouse into the future. I wish you all the best
      and thank you for your kind support and words of encouragement. I am
      looking forward to a little vacation and then finding a new place that
      needs my artistic directorship. I hope I’ll be able to bring some of the
      magic we created at the Post Playhouse along with me. Thank you for all
      the memories.
    </p>

    <p>
      Sincerely,<br />

      Tom Ossowski
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
