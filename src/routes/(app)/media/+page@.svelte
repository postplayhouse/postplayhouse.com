<script lang="ts">
	import Main from "$components/layouts/MainLayout.svelte"
	import Img from "./Img.svelte"

	export let data

	const { imagePaths } = data

	function dropExtension(file: string | undefined) {
		// there could be multiple dots in the filename
		return file?.slice(0, file.lastIndexOf("."))
	}

	/**
	 * This function is used to find the description of the image within the file name itself.
	 *
	 *     someUsefulGrouping,Description+with+spaces.jpg
	 */
	function getDescriptionFromFileName(file: string) {
		const desc = dropExtension(file.split(",")[1])
		return desc ? decodeURI(desc).replaceAll("+", " ") : undefined
	}

	const photoData: Array<{
		file: string
		featured?: boolean
		description?: string
		ignore?: boolean
		with?: string
	}> = imagePaths.map((file) => ({
		file,
		description: getDescriptionFromFileName(file),
	}))
</script>

<Main unconstrainedWidth>
	<div class="flex flex-wrap justify-center">
		{#each photoData as photo}
			<div class="min-w-[fit-content] m-2 text-center">
				<Img
					class="object-contain sm:max-h-80 rounded-lg"
					src="/images/gallery/{photo.file}"
					alt="{photo.description || photo.file}"
				/>
				{#if photo.description}
					{@html photo.description}<br />
				{/if}
			</div>
		{/each}
	</div>
</Main>
