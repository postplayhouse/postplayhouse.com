<script lang="ts">
	// library for creating dropdown menu appear on click
	import { createPopper } from "@popperjs/core"
	import type { ProductionDetails } from "./showingsData"
	import type { MouseEventHandler } from "svelte/elements"
	import type { Snippet } from "svelte"

	// core components

	interface Props {
		style?: string
		choices?: ProductionDetails[]
		class?: string
		onChoice?: (choice: ProductionDetails | null) => void
		children: Snippet
	}

	let {
		style = "",
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

<svelte:window on:click="{action}" />

<button
	class="{className}"
	type="button"
	{style}
	bind:this="{btnRef}"
	onclick="{toggleDropdown}"
>
	{@render children()}
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
				onclick="{() => choose(choice)}"
				style="--show-color:#{choice?.color || '444'}"
				class="block w-full whitespace-no-wrap ring-black hover:ring-4 shadow py-2 px-4 [text-shadow:0.035em_0.035em_0px_color-mix(in_srgb,black_50%,var(--show-color)),0.035em_0.07em_0px_color-mix(in_srgb,black_50%,var(--show-color)),0_0_4px_color-mix(in_srgb,black_50%,var(--show-color))]
							bg-[--show-color]"
			>
				{choice?.longTitle ?? "None"}
			</button>
		{/each}
	</div>
</div>
