<script lang="ts">
	import { createEventDispatcher } from "svelte"
	import type { FormEventHandler } from "svelte/elements"

	let {
		options = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
	}: { options: string[] } = $props()

	let filteredOptions = $state(options)

	let selectedOption = $state("")

	const dispatch = createEventDispatcher()

	const filterOptions: FormEventHandler<HTMLInputElement> = (event) => {
		const searchText = event.currentTarget.value.toLowerCase()
		filteredOptions = options.filter((option) =>
			option.toLowerCase().includes(searchText),
		)
	}

	function selectOption(option: string) {
		selectedOption = option
		dispatch("optionSelected", option)
	}
</script>

Use this filter and list to find and select your old headshot.

<div class="flex flex-col border">
	<input
		class="block border border-gray-500 pl-3 text-2xl"
		type="text"
		placeholder="Type here to search this list..."
		oninput={filterOptions}
	/>

	<ul class="h-96 list-none overflow-auto pl-2">
		{#each filteredOptions as option}
			<li>
				<button
					class="px-2 hover:bg-slate-200 dark:hover:bg-slate-500 {option ===
					selectedOption
						? 'bg-emerald-300 dark:bg-emerald-700'
						: ''}"
					onclick={() => selectOption(option)}
					>{option
						.replace("src/images/people/", "")
						.replace("/", " - ")}</button
				>
			</li>
		{/each}
	</ul>
</div>
