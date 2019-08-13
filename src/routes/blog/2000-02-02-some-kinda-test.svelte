<script>
  export const title = "Some Kinda Test";

  $: count = 0;
</script>

<div on:click={() => (count += 1)}>I have been clicked {count} times</div>
