<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  import site from "../../data/site"

  export const load: Load = async () => {
    return {
      redirect: `/productions/${site.season}`,
      status: 302,
    }
  }
</script>
