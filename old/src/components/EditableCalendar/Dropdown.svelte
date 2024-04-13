<script lang="ts">
	// library for creating dropdown menu appear on click
	import { createPopper } from "@popperjs/core"
	import { createEventDispatcher } from "svelte"
	import type { ProductionDetails } from "./showingsData"
	import type { MouseEventHandler } from "svelte/elements"

	// core components

	let className: string = ""
	export { className as class }

	export let color: string = "gray"

	export let choices: ProductionDetails[] = []

	let dropdownPopoverShow = false

	let btnRef: HTMLElement
	let popoverRef: HTMLElement

	function closeOnClickAway(e: MouseEvent) {
		if (dropdownPopoverShow) {
			let targetEl = e.target as Node | undefined | null
			do {
				if (targetEl === popoverRef) {
					// This is a click inside, does nothing, just return.
					return
				}
				// Go up the DOM
				targetEl = targetEl?.parentNode
			} while (targetEl)
			toggleDropdown()
		}
	}

	function doNothing() {}

	let action: MouseEventHandler<Window> = doNothing

	function toggleDropdown() {
		if (dropdownPopoverShow) {
			dropdownPopoverShow = false
			action = doNothing
		} else {
			dropdownPopoverShow = true
			createPopper(btnRef, popoverRef, { placement: "top-start" })
			setTimeout(() => (action = closeOnClickAway))
		}
	}

	const dispatch = createEventDispatcher()
	function choose(choice: ProductionDetails | null) {
		toggleDropdown()
		dispatch("choice", choice)
	}
</script>

<svelte:window on:click="{action}" />

<button
	class="ease-linear transition-all duration-75 h-full w-full hover:opacity-25 border border-transparent hover:border-gray-500 border-dotted {className}"
	type="button"
	style="background-color: {color}"
	bind:this="{btnRef}"
	on:click="{toggleDropdown}"
>
	<slot />
</button>

<div
	bind:this="{popoverRef}"
	class="pt-2 z-50 float-left w-52 {dropdownPopoverShow
		? 'block'
		: 'hidden'} shadow-lg"
>
	<div
		class="bg-grey-400 p-4 rounded shadow-lg w-full border border-grey-500 space-y-4"
	>
		{#each [...choices, null] as choice}
			<button
				type="button"
				on:click="{() => choose(choice)}"
				class="block w-full whitespace-no-wrap border-4 border-transparent hover:border-black shadow py-2 px-4"
				style="background-color: #{choice?.color ?? 'fff'}"
			>
				{choice?.longTitle ?? "None"}
			</button>
		{/each}
	</div>
</div>
