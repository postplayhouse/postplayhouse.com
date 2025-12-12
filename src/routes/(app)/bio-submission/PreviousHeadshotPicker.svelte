<script lang="ts">
	type Props = {
		options: string[]
		onOptionSelected?: (option: string) => void
		selectedOption?: string
	}

	let {
		options = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
		onOptionSelected = () => {},
		selectedOption = "",
	}: Props = $props()

	let searchText = $state("")

	let filteredOptions = $derived(
		options.filter((option) => option.toLowerCase().includes(searchText)),
	)
</script>

Use this filter and list to find and select your old headshot.

<div class="flex flex-col border">
	<input
		class="block border border-gray-500 pl-3 text-2xl"
		type="text"
		placeholder="Type here to search this list..."
		bind:value={searchText}
	/>

	<ul class="h-96 list-none overflow-auto pl-2">
		{#each filteredOptions as option}
			<li>
				<button
					class="px-2 hover:bg-gray-200 dark:hover:bg-gray-500 {option ===
					selectedOption
						? 'bg-emerald-300 dark:bg-emerald-700'
						: ''}"
					onclick={() => onOptionSelected(option)}
					>{option
						.replace("src/images/people/", "")
						.replace("/", " - ")}</button
				>
			</li>
		{/each}
	</ul>
</div>
