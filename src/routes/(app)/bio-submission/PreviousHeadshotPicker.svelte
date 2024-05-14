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

<div class="border flex flex-col">
	<input
		class="border border-grey-500 block text-2xl pl-3"
		type="text"
		placeholder="Type here to search this list..."
		oninput="{filterOptions}"
	/>

	<ul class="h-96 overflow-auto list-none pl-2">
		{#each filteredOptions as option}
			<li>
				<button
					class="hover:bg-slate-200 dark:hover:bg-slate-500 px-2 {option ===
					selectedOption
						? 'bg-emerald-300 dark:bg-emerald-700'
						: ''}"
					onclick="{() => selectOption(option)}"
					>{option.replace("/images/people/", "").replace("/", " - ")}</button
				>
			</li>
		{/each}
	</ul>
</div>
