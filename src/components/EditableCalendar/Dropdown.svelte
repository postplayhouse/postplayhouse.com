<script lang="ts">
	// library for creating dropdown menu appear on click
	import { createPopper } from "@popperjs/core"
	import type { ProductionDetails } from "./showingsData"
	import type { MouseEventHandler } from "svelte/elements"
	import type { Snippet } from "svelte"

	// core components

	interface Props {
		color?: string
		choices?: ProductionDetails[]
		class?: string
		onChoice?: (choice: ProductionDetails | null) => void
		children: Snippet
	}

	let {
		color = "gray",
		class: className = "",
		choices = [],
		onChoice = () => {},
		children,
	}: Props = $props()

	let dropdownPopoverShow = $state(false)

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

	let action: MouseEventHandler<Window> = $state(doNothing)

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

	function choose(choice: ProductionDetails | null) {
		toggleDropdown()
		onChoice(choice)
	}
</script>

<svelte:window onclick={action} />

<button
	class="h-full w-full border border-dotted border-transparent transition-all duration-75 ease-linear hover:border-gray-500 hover:opacity-25 {className}"
	type="button"
	style="background-color: {color}"
	bind:this={btnRef}
	onclick={toggleDropdown}
>
	{@render children()}
</button>

<div
	bind:this={popoverRef}
	class="z-50 float-left w-52 pt-2 {dropdownPopoverShow
		? 'block'
		: 'hidden'} shadow-lg"
>
	<div
		class="border-grey-500 bg-grey-400 w-full space-y-4 rounded-sm border p-4 shadow-lg"
	>
		{#each [...choices, null] as choice}
			<button
				type="button"
				onclick={() => choose(choice)}
				class="whitespace-no-wrap block w-full border-4 border-transparent px-4 py-2 shadow-sm hover:border-black"
				style="background-color: #{choice?.color ?? 'fff'}"
			>
				{choice?.longTitle ?? "None"}
			</button>
		{/each}
	</div>
</div>
