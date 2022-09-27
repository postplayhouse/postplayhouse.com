<script lang="ts">
  throw new Error(
    "@migration task: Add data prop (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292707)",
  )

  import TicketsButton from "$components/TicketsButton.svelte"
  import site from "$data/site"
  export const title = "Announcing our 2022 season!"
</script>

{#if site.season === 2022 && site.ticketsAvailable}
  <div class="bg-green-100 p-4 my-2 text-center">
    <strong>Update:</strong>
    <a href="{site.ticketsLink}" class="link-green"
      >Tickets are now on sale! Get yours today!</a
    >
  </div>
{/if}

<p class="my-2">
  We are so happy to be back, and we can't wait for you to see these wonderful
  shows!
</p>

<div class="w-2/3 m-auto">
  <img
    src="/images/2022/full-season.jpg"
    alt="2022 season logos: The Sound of Music, Damn Yankees, Chuch Basement Ladies, Desperate Measures, and Something Rotten!"
  />
</div>

<section class="space-y-2">
  <h2 class="h2">And one more thing... we have a new tickets site!</h2>

  <p>
    We are also announcing that we've changed our online tickets provider. This
    means you'll see a different looking site when you go to purchase your
    tickets.
  </p>

  <p>
    When we changed over to the new site, we were not able to bring your old
    passwords along with us. This is a good thing for security, but it does add
    one step to your first sign in attempt:
  </p>

  <p>
    <strong>When you log in for the first time on the new site</strong>, you'll
    need to use the “forgot password” function to reset your password.
  </p>
</section>

{#if site.season === 2022}
  <div class="flex justify-center m-4">
    <TicketsButton />
  </div>
{/if}
