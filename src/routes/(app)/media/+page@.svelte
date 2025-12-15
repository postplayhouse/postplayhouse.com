<script lang="ts">
	import Main from "$components/layouts/MainLayout.svelte"
	import { getMediaImages } from "./mediaImages.remote.js"

	const images = $derived(await getMediaImages())
</script>

<Main unconstrainedWidth>
	<div class="flex flex-wrap justify-center">
		{#each images as photo}
			<div class="m-2 min-w-fit text-center">
				<enhanced:img
					class="rounded-lg object-contain sm:max-h-80"
					src={photo.src}
					alt={photo.description}
				/>
				{#if photo.description}
					{@html photo.description}<br />
				{/if}
			</div>
		{/each}
	</div>
</Main>
