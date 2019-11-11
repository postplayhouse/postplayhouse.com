<script>
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

  src.map((path, i) => checkImage(path, () => report(i)))
</script>

{#if winningImage}
  <img src={winningImage} {alt} {...rest} />
{/if}
