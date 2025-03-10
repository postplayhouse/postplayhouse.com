<script lang="ts" module>
	import { marked } from "marked"
	import { type Person, toPerson } from "$models/Person"

	marked.setOptions({ smartypants: true })
</script>

<script lang="ts">
	import CastList from "$components/program/CastList.svelte"
	import ProductionList from "$components/program/ProductionList.svelte"
	import { sortPeople, personIsInGroup, slugify } from "$helpers"
	import PersonImage from "$components/PersonImage.svelte"
	import { findOriginalPersonImage } from "$helpers/enhancedImg"

	function renameImgFile(imgPath: string, newBaseNameWithoutExt: string) {
		const ext = imgPath.split(".").pop()
		return newBaseNameWithoutExt + "." + ext
	}

	let { data } = $props()

	const { people, productions } = data

	const initialSort = sortPeople(people).map(toPerson)
	const additional = initialSort.filter((x) => personIsInGroup(x, "additional"))

	// Additional bios to the end
	const sortedPeople = [
		...initialSort.filter((x) => !additional.includes(x)),
		...additional,
	]

	function personSlug(person: Person) {
		return slugify(person.firstName + person.lastName)
	}

	function notInBoard(person: Person) {
		return !personIsInGroup(person, "board")
	}
	function inBoard(person: Person) {
		return personIsInGroup(person, "board")
	}
	function notInAdditional(person: Person) {
		return !personIsInGroup(person, "additional")
	}

	let showShortBio: Record<string, boolean> = $state({})

	function toggleShortBio(person: Person) {
		showShortBio[person.id]
			? (showShortBio[person.id] = false)
			: (showShortBio[person.id] = true)
	}

	let showUi = $state(true)

	let isDownloadingImages = $state(false)

	async function downloadAllPeopleImages() {
		if (isDownloadingImages) return
		isDownloadingImages = true
		const JsZip = (await import("jszip")).default
		const zip = new JsZip()

		for (const person of sortedPeople) {
			const originalImg = findOriginalPersonImage(person.image)
			if (originalImg) {
				const response = await fetch(originalImg)
				const blob = await response.blob()
				zip.file(renameImgFile(originalImg, personSlug(person)), blob)
			}
		}

		const content = await zip.generateAsync({ type: "blob" })

		const date = new Date().toISOString().split("T")[0]

		const url = URL.createObjectURL(content)
		const a = document.createElement("a")
		a.href = url
		a.download = `post_playhouse_program_bio_images_${date}.zip`
		a.click()
		URL.revokeObjectURL(url)
		a.remove()

		isDownloadingImages = false
	}
</script>

<div id="TheTop"></div>

<label
	><input
		type="checkbox"
		checked={showUi}
		onchange={() => (showUi = !showUi)}
	/> Show non-program UI in Bios (buttons/anchors)</label
>

<div class="my-4">
	<header>Jump to Bio</header>

	<ol class="md:[columns:3]">
		{#each sortedPeople.filter(notInBoard) as person}
			<li>
				<a class="link-green" href="#{personSlug(person)}">
					{person.name}
					{#if !person.bio}
						<span
							class="whitespace-nowrap rounded-full bg-yellow-200 p-1 px-2 text-black !no-underline"
						>
							no bio
						</span>
					{/if}
				</a>
			</li>
		{/each}
	</ol>
</div>

<a href="#TheBoard" class="link-green my-4 block">Jump to the Board</a>

<div class="mx-auto my-8 max-w-lg space-y-3 rounded p-8 text-center shadow-xl">
	<button class="btn-p" onclick={downloadAllPeopleImages}>
		{#if isDownloadingImages}
			Downloading...
		{:else}
			Download All Bio Images
		{/if}
	</button>

	<div>
		Downloads a ZIP of {sortedPeople.length} files. This will take time, so please
		be patient after you click the button!
	</div>
</div>

<div>
	{#each productions as production}
		<h3 class="h3">{production.title}</h3>
		<ProductionList people={sortedPeople} {production} />
		<CastList people={sortedPeople} {production} />
	{/each}
</div>

{#snippet downloadableImage(originalImg, person)}
	<div class="mb-4 text-center">
		<a
			class="group inline-block max-w-full hover:bg-gray-200"
			href={originalImg}
			download={renameImgFile(originalImg, personSlug(person))}
		>
			<PersonImage
				partialPath={person.image}
				alt="{person.image ? '' : 'missing '}picture of {person.name}"
				class="m-auto block max-h-96 min-h-64 w-96 max-w-full object-contain"
			/>
			{#if showUi}
				<div class="text-center">
					<span
						class="btn-p group-hover:border-green-700 group-hover:bg-green-500"
						>Download Orignal Image</span
					>
				</div>
			{/if}</a
		>
	</div>
{/snippet}

<div class="helvetica my-8">
	{#each sortedPeople.filter(notInBoard) as person}
		{@const originalImg = findOriginalPersonImage(person.image)}

		<div class="my-8" id={personSlug(person)}>
			{#if notInAdditional(person) && originalImg}
				{@render downloadableImage(originalImg, person)}
			{/if}

			<div class="m-auto max-w-2xl">
				<h3 class="text-2xl">{person.name}</h3>

				{#if person.location}
					{@html marked.parseInline(person.location)}
				{/if}

				{#if person.positions.length > 0}
					<p class="my-8">
						{#each person.positions as position}
							{@html position.replace(/---/g, "&mdash;")}<br />
						{/each}
					</p>
				{:else if person.productionPositions.length > 0 || person.roles.length > 0 || person.staffPositions.length > 0}
					<p class="my-8">
						{#each person.staffPositions as position}
							{@html position.replace(/---/g, "&mdash;")}<br />
						{/each}

						{#each person.productionPositions as position}
							{position.productionName} &mdash; {position.positions.join(
								", ",
							)}<br />
						{/each}

						{#each person.roles as role}
							{role.productionName} &mdash; {role.positions.join(", ")}<br />
						{/each}
					</p>
				{/if}

				{#if person.programBio && showUi}
					<button
						class="btn px-2 py-1"
						type="button"
						onclick={() => toggleShortBio(person)}
					>
						{#if showShortBio[person.id]}Show Long Bio{:else}Show Short Bio{/if}
					</button>
				{/if}

				{#if showShortBio[person.id]}
					{@html marked(
						person.programBio || "(no program bio actually exists)",
					)}
				{:else}
					{@html marked(person.bio)}
				{/if}
			</div>
		</div>
		{#if showUi}
			<a class="link-green" href="#TheTop">Back to Top</a>
		{/if}
	{/each}
</div>

<div class="my-8 space-y-8">
	<h1 id="TheBoard" class="text-4xl">Board Headshots and Names</h1>

	{#each sortedPeople.filter(inBoard) as person}
		{@const originalImg = findOriginalPersonImage(person.image)}

		<div class="helvetica">
			{#if originalImg}
				{@render downloadableImage(originalImg, person)}
			{/if}

			<div class="text-center">
				<div>{person.name}</div>
				{#each person.positions as position}
					{position}
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.helvetica {
		font-family: Helvetica !important;
	}
</style>
