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
	import Markdown from "$components/Markdown.svelte"

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

<div
	class="mx-auto my-8 max-w-lg space-y-3 rounded border p-8 text-center shadow-xl"
>
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
	<div class="sticky top-0 text-right">
		<label
			class="my-4 inline-flex cursor-pointer items-center gap-1 rounded-md border bg-white p-4 shadow"
			>Show extra UI (buttons/anchors)
			<button
				onclick={() => (showUi = !showUi)}
				data-enabled={showUi || undefined}
				type="button"
				class="focus:outline-hidden relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 data-[enabled]:bg-green-600"
				role="switch"
				aria-checked="false"
			>
				<span class="sr-only">Use setting</span>
				<span
					data-enabled={showUi || undefined}
					aria-hidden="true"
					class="pointer-events-none inline-block size-5 translate-x-0 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out data-[enabled]:translate-x-5"
				></span>
			</button>
		</label>
	</div>

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
					<div class="mb-6 flex items-center gap-4">
						<div
							class="flex justify-center gap-1 overflow-clip rounded-lg border border-green-300 bg-green-200 p-1"
						>
							<button
								class="rounded px-2 py-1 {!showShortBio[person.id]
									? 'border border-green-600 bg-white text-black shadow'
									: 'border border-transparent text-green-800 hover:bg-green-100'}"
								type="button"
								disabled={!showShortBio[person.id]}
								onclick={() => toggleShortBio(person)}
							>
								Long Bio
							</button>
							<button
								class="rounded px-2 py-1 {showShortBio[person.id]
									? 'border border-green-600 bg-white text-black shadow'
									: 'border border-transparent text-green-800 hover:bg-green-100'}"
								type="button"
								disabled={showShortBio[person.id]}
								onclick={() => toggleShortBio(person)}
							>
								Short Bio
							</button>
						</div>
						<div class="grid grid-cols-[auto,auto] gap-x-2 text-sm">
							<div>Long bio word count:</div>
							<div
								class="text-right tabular-nums {!showShortBio[person.id] &&
									'font-bold'}"
							>
								{person.bio.split(/\s/).length}
							</div>
							<div>Short bio word count:</div>
							<div
								class="text-right tabular-nums {showShortBio[person.id] &&
									'font-bold'}"
							>
								{person.programBio.split(/\s/).length}
							</div>
						</div>
					</div>
				{/if}

				{#if showShortBio[person.id]}
					<Markdown
						source={person.programBio || "(no program bio actually exists)"}
					/>
				{:else}
					<Markdown source={person.bio} />
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
