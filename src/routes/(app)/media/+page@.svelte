<script lang="ts">
	import Main from "$components/layouts/MainLayout.svelte"

	let { data } = $props()

	const { images } = data
</script>

<Main unconstrainedWidth>
	<div class="flex flex-wrap justify-center">
		{#each images as photo}
			<div class="min-w-[fit-content] m-2 text-center">
				<img
					class="object-contain sm:max-h-80 rounded-lg"
					src="{photo.src}"
					alt="{photo.description || photo.src}"
				/>
				{#if photo.description}
					{@html photo.description}<br />
				{/if}
			</div>
		{/each}
	</div>
</Main>
