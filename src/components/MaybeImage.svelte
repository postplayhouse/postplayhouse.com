<script lang="ts">
  import { onMount } from "svelte"
  export let src: string[] = []

  const { src: _, alt, ...rest } = $$props

  if (!Array.isArray(src)) {
    src = [src]
  }

  function checkImage(imageSrc: string, good: Callback, bad = () => {}) {
    var img = new Image()
    img.onload = good
    img.onerror = bad
    img.src = imageSrc
  }

  function reportSrcExists(srcIndex: number) {
    winningSrcIndex = srcIndex < winningSrcIndex ? srcIndex : winningSrcIndex
    winningSrc = src[winningSrcIndex]
  }

  // The lowest index for src wins
  $: winningSrc = undefined as string | undefined
  let winningSrcIndex = Infinity

  // We render nothing unless mounted in the client. SSR will result in lots of
  // thrown error noise
  let mounted = false
  onMount(() => {
    mounted = true
    src.forEach((path, i) => checkImage(path, () => reportSrcExists(i)))
  })
</script>

{#if winningSrc}<img src="{winningSrc}" alt="{alt}" {...rest} />{/if}
