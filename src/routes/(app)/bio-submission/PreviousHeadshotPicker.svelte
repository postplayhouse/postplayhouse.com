<script lang="ts">
	import { createEventDispatcher } from "svelte"
	import type { FormEventHandler } from "svelte/elements"

	export let options = [
		"Option 1",
		"Option 2",
		"Option 3",
		"Option 4",
		"Option 5",
	]
	let filteredOptions = options

	let selectedOption = ""

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
		on:input="{filterOptions}"
	/>

	<ul class="h-96 overflow-auto list-none pl-2">
		{#each filteredOptions as option}
			<li>
				<button
					class="hover:bg-slate-200 px-2 {option === selectedOption
						? 'bg-emerald-300'
						: ''}"
					on:click="{() => selectOption(option)}"
					>{option.replace("/images/people/", "").replace("/", " - ")}</button
				>
			</li>
		{/each}
	</ul>
</div>
