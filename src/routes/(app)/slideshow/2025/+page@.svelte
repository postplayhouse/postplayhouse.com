<script lang="ts" module>
	import { marked } from "marked"

	marked.setOptions({ smartypants: true })
</script>

<script lang="ts">
	import Slideshow from "./Slideshow.svelte"
	import type { PageProps } from "./$types"

	let { data }: PageProps = $props()
</script>

<Slideshow slideData={data.slideData} />
