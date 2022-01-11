<script context="module" lang="ts">
  import type { ErrorLoad } from "@sveltejs/kit"

  export const load: ErrorLoad = ({ error, status }) => {
    return { props: { error, status } }
  }
</script>

<script lang="ts">
  import { dev } from "$app/env"
  import { onMount } from "svelte"
  export let status: number
  export let error: Error

  $: matchesOldRoutes = false
  $: tryLocation = ""
  const MATCHES_OLD_ROUTES = /^(\/?news\/\d{4})(\/)(\d{2})(\/)(\d{2})(\/)(.*)/g

  onMount(() => {
    matchesOldRoutes = MATCHES_OLD_ROUTES.test(window.location.pathname)
    tryLocation = window.location.pathname.replace(
      MATCHES_OLD_ROUTES,
      function (_full, _1, _2, _3, _4, _5, _6, _7) {
        return `${_1}-${_3}-${_5}-${_7}`
      },
    )
  })
</script>

<style>
  h1,
  p {
    margin: 0 auto;
  }

  h1 {
    font-size: 2.8em;
    font-weight: 700;
    margin: 0 0 0.5em 0;
  }

  p {
    margin: 1em auto;
  }

  @media (min-width: 480px) {
    h1 {
      font-size: 4em;
    }
  }
</style>

<svelte:head>
  <title>{status}</title>
</svelte:head>

{#if status === 404 && matchesOldRoutes}{(window.location.href =
    tryLocation)}{/if}

<h1>{status}</h1>
<p>{error.message}</p>

{#if dev && error.stack}
  <pre>{error.stack}</pre>
{/if}
