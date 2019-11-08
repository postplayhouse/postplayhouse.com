<script context="module">
  import marked from "marked"
  marked.setOptions({ smartypants: true })
</script>

<script>
  export let source
</script>

{@html marked(source)}
