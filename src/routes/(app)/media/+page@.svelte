<script lang="ts">
	import Main from "$components/layouts/MainLayout.svelte"
	import { getMediaImages } from "./mediaImages.remote.js"
</script>

<Main unconstrainedWidth>
	<div class="flex flex-wrap justify-center">
		{#each await getMediaImages() as photo}
			<div class="m-2 min-w-fit text-center">
				<img
					class="rounded-lg object-contain sm:max-h-80"
					src={photo.src}
					alt={photo.description || photo.src}
				/>
				{#if photo.description}
					{@html photo.description}<br />
				{/if}
			</div>
		{/each}
	</div>
</Main>
