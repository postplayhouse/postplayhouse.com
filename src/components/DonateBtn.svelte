<script lang="ts">
  import { showDonateModal } from "$data/stores"

  let className = "btn btn-p block mx-auto my-8"
  export { className as class }
</script>

<button class="{className}" on:click="{showDonateModal.toggle}"
  ><slot>Donate Online Now</slot></button
>
