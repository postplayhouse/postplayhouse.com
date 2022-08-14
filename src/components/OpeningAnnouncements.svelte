<script lang="ts">
  import {
    diffDays,
    formatDate,
    getDateFor,
    getToday,
    nonValueToEmptyStr,
  } from "../helpers"
  import { weekdays } from "./Calendar/calendarHelpers"

  import Markdown from "./Markdown.svelte"
  import MaybeImage from "./MaybeImage.svelte"
  import TicketsButton from "./TicketsButton.svelte"

  export let productions: Production[] = []
  export let closingDate: string

  const today = getToday()

  const daysToClosing = diffDays(today, getDateFor(closingDate))
  const isBeforeClosing = daysToClosing >= 0
  const isAfterClosing =
    // 4pm MDT
    new Date() > new Date(`${closingDate}T16:00:00.000-06:00`)

  const enhancedProductions = productions
    .map((p) => ({
      ...p,
      daysUntilOpening: diffDays(today, getDateFor(p.opening)),
      dayOfWeek: weekdays[getDateFor(p.opening).getDay()],
      season: getDateFor(p.opening).getFullYear(),
    }))
    .sort((a, b) => a.daysUntilOpening - b.daysUntilOpening)
    .map(({ image, ...p }) => ({
      ...p,
      imagePath: `/g/images/${p.season}/${image}`,
      fallbackImagePath: `/images/${p.season}/${image}`,
    }))

  const openingSoon = enhancedProductions
    // Nothing that is already open
    .filter((p) => p.daysUntilOpening > -1)
    // Things that open in the next 4 days. Historically, this has always been a
    // Monday (4 days before Friday).
    .filter((p) => p.daysUntilOpening <= 4)
    .at(0)

  const nowRunning = enhancedProductions.filter((p) => p.daysUntilOpening <= 0)

  const allShowsAreRunning =
    isBeforeClosing && !enhancedProductions.find((p) => p.daysUntilOpening > 0)
</script>

{#if isAfterClosing}
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
{:else}
  {#if openingSoon}
    <h3 class="h1 font-uber">
      {openingSoon.title} opens {openingSoon.daysUntilOpening > 0
        ? `on ${openingSoon.dayOfWeek}`
        : "today"}!
    </h3>

    <div class="md:flex items-center my-8">
      <div class="shrink">
        <MaybeImage
          src="{[openingSoon.imagePath, openingSoon.fallbackImagePath]}"
          alt="Show Logo for {openingSoon.title}"
        />
      </div>
      <div class="text-center md:text-left shrink-0">
        <Markdown source="{openingSoon.writers}" />
      </div>
    </div>

    <Markdown source="{openingSoon.description}" />

    <div class="flex justify-center m-4">
      <TicketsButton />
    </div>
  {/if}

  {#if daysToClosing < 30}
    <div class="my-12">
      <h3 class="h1 mb-4">Hurry, time is running out!</h3>
      {#if daysToClosing > 1}
        <p class="text-2xl">
          There are only <span class="text-3xl font-bold"
            >{daysToClosing} more days</span
          >
          until our final performance on {formatDate(closingDate, {
            skipYear: true,
          })}!
        </p>
      {:else if daysToClosing === 1}
        <p class="h3 text-center">Tomorrow is our final performance!</p>
      {:else}
        <p class="h3 text-center">
          Today is your last chance to see us this summer!
        </p>
      {/if}

      <div class="m-4 h3">
        (We are sold out! But you can call the box office to inquire about wait
        lists.)
      </div>
    </div>
  {/if}

  {#if enhancedProductions.length > 0}
    <h3 class="h1 my-8">
      Our {nonValueToEmptyStr(enhancedProductions.at(0)?.season)} Summer Season
    </h3>

    {#if allShowsAreRunning}
      <div class="text-3xl text-center my-8">All shows are now running!</div>
    {/if}

    <slot name="seasonArtworkImage" />

    <div class="flex justify-center my-12">
      <TicketsButton />
    </div>

    {#if !allShowsAreRunning && nowRunning.length > 0}
      <div>
        <h4 class="h1 mt-24 mb-12">Now running:</h4>

        <ul class="list-none p-0 m-auto flex flex-wrap">
          {#each nowRunning as production}
            <li class="max-w-full md:w-1/2 p-2">
              <MaybeImage
                src="{[production.imagePath, production.fallbackImagePath]}"
                alt="{production.title}"
              />
            </li>
          {/each}
        </ul>
        <div class="flex justify-center my-12">
          <TicketsButton />
        </div>
      </div>
    {/if}
  {/if}
{/if}
