<script lang="ts">
	// @ts-expect-error // something about the query params
	import testImg from "/src/images/people/2022/ross-boyd.jpg?enhanced&w=200;400"
</script>

<div class="flex flex-col max-w-[500px]">
	{#if typeof testImg === "string"}
		AS IMAGE
		<img src="{testImg}" alt="Ross Boyd" />
	{:else}
		AS ENHANCED
		<div class="grid grid-cols-2">
			<enhanced:img src="{testImg}"></enhanced:img>
			<pre class="whitespace-pre-wrap">{JSON.stringify(testImg, null, 2)}</pre>
		</div>
	{/if}
</div>
