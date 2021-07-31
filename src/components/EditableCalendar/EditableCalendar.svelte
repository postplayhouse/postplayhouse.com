<script lang="ts">
  import Dropdown from "./Dropdown.svelte"
  import type { PerformanceDetails, ProductionDetails } from "./showingsData"
  import { dateOfPerformance, getDateDetails, makeDateIterator } from "./dates"
  import { addPerformance, removePerformanceBySlot } from "./changeset"
  import schedule, { replaceAfterMount } from "./store"
  import { page } from "$app/stores"
  import { add } from "date-fns"
  import { onMount } from "svelte"
  import { browser } from "$app/environment"

  onMount(replaceAfterMount)

  $: dates = Array.from(makeDateIterator($schedule))

  function handleChoice(
    choice: Omit<PerformanceDetails, "id"> & {
      production: ProductionDetails | null
    },
  ) {
    let tempSchedule = removePerformanceBySlot($schedule, choice)

    if (choice.production) {
      const { production, ...rest } = choice
      tempSchedule = addPerformance(tempSchedule, {
        ...rest,
        id: production.shortTitle,
      })
    }

    schedule.set(tempSchedule)
  }

  function handleCopyUrl() {
    const url = new URL(window.location.toString())
    window.navigator.clipboard.writeText(
      url.origin + url.pathname + decodeURIComponent(url.search),
    )
  }

  function moveShows(slot: keyof Parameters<typeof add>[1], distance: number) {
    const newPerfs: PerformanceDetails[] = $schedule.performances.map(
      (perf) => {
        const date = dateOfPerformance(perf)
        const newDate = add(date, { [slot]: distance })
        const newDetails = getDateDetails(newDate)
        return { ...perf, ...newDetails }
      },
    )
    schedule.set({ ...$schedule, performances: newPerfs })
  }

  function handleProductionDetailChange(
    i: number,
    property: keyof ProductionDetails,
  ) {
    return (newValue: string) => {
      const { performances, productions } = $schedule
      productions[i]![property] = newValue

      console.log(productions[i]![property])
      schedule.set({ performances, productions })
    }
  }
</script>

<div class="prose mb-8 space-y-8">
  <p class="text-xl bold">
    You can edit the calendar below by changing inputs and clicking on the show
    slots on the calendar itself.
  </p>

  <div class="mt-8 bg-gray-200 rounded p-4 space-y-6">
    <p>
      <strong>When you are done</strong>, you can share your new calendar by
      copying and sharing the URL below.
    </p>

    <div>
      <code class="!break-words">
        {#if browser}
          {$page.url.origin}{$page.url.pathname}{decodeURIComponent(
            $page.url.search,
          )}
        {/if}
      </code>
    </div>
    <button class="btn-p" on:click="{handleCopyUrl}"
      >Copy URL to clipboard</button
    >
    <p>
      (<strong> You HAVE to copy the URL to share. </strong> This thing does not
      save your work.)
    </p>
  </div>
</div>

<form on:submit|preventDefault class="my-12">
  <div class="text-xl">Productions</div>
  <div class="opacity-50">
    You can change the title and color. (Probably just pick an abbreviated
    title.)
  </div>
  <div class="flex flex-wrap gap-4 my-4">
    {#each $schedule.productions as production, i}
      <div class="flex gap-1">
        <input
          class="inline-block h-full border border-gray-500 rounded cursor-pointer"
          type="color"
          value="#{production.color}"
          on:input="{(e) =>
            handleProductionDetailChange(
              i,
              'color',
            )(e.currentTarget.value.slice(1))}"
        />
        <input
          class="inline-block p-2 border border-gray-500 rounded shadow-inner bg-gray-100"
          type="text"
          value="{production.longTitle}"
          on:input="{(e) =>
            handleProductionDetailChange(
              i,
              'longTitle',
            )(e.currentTarget.value)}"
        />
      </div>
    {/each}
  </div>
</form>

<div class="mt-12 mb-4">
  Use these buttons to move dates to match the year you are working on. <div
    class="opacity-50"
  >
    (When you move a year, the days will be off by one, and you'll use the day
    adjustments to realign)
  </div>
</div>
<button class="btn-p" on:click="{() => moveShows('days', -1)}"
  >Back 1 Day</button
>
<button class="btn-p" on:click="{() => moveShows('days', 1)}"
  >Forward 1 Day</button
>
<button class="btn-p ml-8" on:click="{() => moveShows('years', -1)}"
  >Back 1 Year</button
>
<button class="btn-p" on:click="{() => moveShows('years', 1)}"
  >Forward 1 Year</button
>

<div class="text-2xl bold mt-12 text-center mb-6">
  {dates[0]?.monthName}
  {dates[0]?.year}
</div>

<div class="grid grid-cols-7 bg-gray-300 gap-1 border-4 border-gray-300">
  <div class="text-center">Sun</div>
  <div class="text-center">Mon</div>
  <div class="text-center">Tue</div>
  <div class="text-center">Wed</div>
  <div class="text-center">Thu</div>
  <div class="text-center">Fri</div>
  <div class="text-center">Sat</div>

  {#each dates as day, i}
    <div
      class="bg-white p-1"
      class:bg-opacity-50="{day.month % 2 === 0}"
      class:bg-opacity-20="{day.weekday === 2}"
      style="{i === 0 ? 'grid-column-start: ' + day.weekday : ''}"
    >
      <div class="flex justify-end">
        {#if day.day === 1 || i === 0}<span class="font-bold">
            {day.monthName}
          </span>
        {/if}
        <div class="flex-grow"></div>
        {day.day}
      </div>

      {#each [1, 2, 3] as performanceSlot}
        <div class="h-7">
          {#each day.performances.filter((p) => p.slot === performanceSlot) as performance}
            <Dropdown
              color="#{performance.color}"
              choices="{$schedule.productions}"
              on:choice="{(e) =>
                handleChoice({
                  ...day,
                  slot: performanceSlot,
                  production: e.detail,
                })}"
            >
              {performance.longTitle}
            </Dropdown>
          {:else}
            <Dropdown
              class="text-transparent hover:text-black"
              color="transparent"
              choices="{$schedule.productions}"
              on:choice="{(e) =>
                handleChoice({
                  ...day,
                  slot: performanceSlot,
                  production: e.detail,
                })}"
            >
              Nothing
            </Dropdown>
          {/each}
        </div>
      {/each}
    </div>
  {/each}
</div>
