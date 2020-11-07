<script lang="ts">
  import { onMount } from "svelte"
  export let src = []

  const { src: _, alt, ...rest } = $$props

  if (!Array.isArray(src)) {
    src = [src]
  }

  function checkImage(imageSrc, good, bad = () => {}) {
    var img = new Image()
    img.onload = good
    img.onerror = bad
    img.src = imageSrc
  }

  function report(i) {
    winningIndex = i < winningIndex ? i : winningIndex
    winningImage = src[winningIndex]
  }

  $: winningImage = null
  let winningIndex = Infinity

  // For SSR, we can render the assumed first image
  let mounted = false
  onMount(() => {
    mounted = true
    src.map((path, i) => checkImage(path, () => report(i)))
  })
</script>

{#if !mounted}<img src="{src[0]}" alt="{alt}" {...rest} />{/if}

{#if winningImage}<img src="{winningImage}" alt="{alt}" {...rest} />{/if}
