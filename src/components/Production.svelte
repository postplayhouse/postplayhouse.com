<script>
  import Markdown from "./Markdown.svelte"
  import MaybeImage from "./MaybeImage.svelte"
  export let production
  export let season

  const imagePath = `/g/images/${season}/${production.image}`
  const fallbackImagePath = `/images/${season}/${production.image}`
</script>

{production.title}
<article class="production">
  <header class="entry-header">
    <h1 class="production-title">
      {#if production.pre_title}
        <div class="production-pre-title">{production.pre_title}</div>
      {/if}
      {production.title}
    </h1>
    <MaybeImage
      class="production-image"
      src={[imagePath, fallbackImagePath]}
      alt="Show Logo for {production.title}" />
  </header>

  {#if production.opening}
    <div class="dates-message">Opens {production.opening}</div>
  {/if}
  {#if production.rating}
    <div class="production-rating">
      <a href="/ratings">Rating: {production.rating}</a>
      {#if production.rating_explanation}
        <div class="production-rating-explanation">
          {production.rating_explanation}
        </div>
      {/if}
    </div>
  {/if}
  {#if production.writers}
    <div class="writers">
      <Markdown source={production.writers} />
    </div>
  {/if}

  <div class="description">
    <Markdown source={production.description} />

    {#if production.sponsor}
      <div class="sponsor">
        <p>Sponsored By</p>
        {#if production.sponsor.image}
          <img
            class="sponsor-image"
            alt="sponsor logo"
            src="/images/sponsors/{production.sponsor.image}" />
        {:else if production.sponsor.text}{production.sponsor.text}{/if}
      </div>
    {/if}
  </div>
</article>
