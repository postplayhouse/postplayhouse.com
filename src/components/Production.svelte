<script lang="ts">
  import Markdown from "./Markdown.svelte"
  import MaybeImage from "./MaybeImage.svelte"
  import MaybeLink from "./MaybeLink.svelte"
  export let production
  export let season

  const imagePath = `/g/images/${season}/${production.image}`
  const fallbackImagePath = `/images/${season}/${production.image}`
</script>

<style>
  @media screen and (max-width: 767px) {
    /* A little hack to make better use of whitespace on smaller screens */
    .writers :global(.via-markdown) {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
    }
  }
</style>

<article class="mt-16 flow-root">
  <header>
    <h2 class="text-6xl leading-none mb-2">
      {#if production.pre_title}
        <div class="text-lg leading-none">{production.pre_title}</div>
      {/if}
      {production.title}
    </h2>
    <MaybeImage
      class="max-w-full block md:float-left md:w-3/5 md:mr-4 md:max-w-4xl"
      src="{[imagePath, fallbackImagePath]}"
      alt="Show Logo for {production.title}"
    />
  </header>

  {#if production.opening}
    <div class="font-bold">Opens {production.opening}</div>
  {/if}
  {#if production.rating}
    <div class="">
      <a class="link-green" href="/ratings">Rating: {production.rating}</a>
      {#if production.rating_explanation}
        <div class="p-4 my-2 bg-grey-200 text-grey-600">
          {production.rating_explanation}
        </div>
      {/if}
    </div>
  {/if}
  {#if production.writers}
    <div class="mb-8 font-light writers">
      <Markdown source="{production.writers}" />
    </div>
  {/if}

  <div class="">
    <Markdown source="{production.description}" />

    {#if production.sponsor}
      <MaybeLink class="float-right" href="{production.sponsor.link}">
        <p>Sponsored By</p>
        {#if production.sponsor.image}
          <img
            class="w-48 max-w-full block"
            alt="sponsor logo"
            src="/images/sponsors/{production.sponsor.image}"
          />
        {:else if production.sponsor.text}
          <span class="text-3xl font-bold">{@html production.sponsor.text}</span
          >
        {/if}
      </MaybeLink>
    {/if}
  </div>
</article>
