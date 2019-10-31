<script context="module">
  export function preload({ params, query }) {
    return this.fetch(`data.json`)
      .then((r) => r.json())
      .then((data) => {
        return { data }
      })
  }
</script>

<script>
  import Nav from "../components/Nav.svelte"
  import Header from "../components/Header.svelte"

  export let segment
  export let data
</script>

<style>
  main {
    position: relative;
    max-width: 56em;
    background-color: white;
    padding: 2em;
    margin: 0 auto;
    box-sizing: border-box;
  }
</style>

<Header {data} />
<Nav {segment} />

<main>
  <slot />
</main>
