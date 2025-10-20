<script lang="ts">
	// library for creating dropdown menu appear on click
	import { createPopper } from "@popperjs/core"
	import type { ProductionDetails } from "./showingsData"
	import type { MouseEventHandler } from "svelte/elements"
	import type { Snippet } from "svelte"

	// core components

	interface Props {
		current?: { shortTitle: string }
		style?: string
		choices?: ProductionDetails[]
		class?: string
		onChoice?: (choice: ProductionDetails | null) => void
		children: Snippet
	}

	let {
		current,
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

<svelte:window onclick={action} />

<button
	data-open={dropdownPopoverShow || null}
	class={className}
	type="button"
	{style}
	bind:this={btnRef}
	onclick={toggleDropdown}
>
	{@render children()}
</button>

<div
	bind:this={popoverRef}
	class="z-50 w-52 py-2 {dropdownPopoverShow ? 'block' : 'hidden'}"
>
	<div
		class="w-full space-y-4 rounded-sm border border-gray-500 bg-gray-400 p-4 shadow-lg"
	>
		{#each [...choices, null] as choice}
			{@const chosen = choice?.shortTitle === current?.shortTitle}
			<button
				type="button"
				onclick={() => choose(choice)}
				style="--show-color:#{choice?.color || '444'};"
				data-chosen={chosen || null}
				class="whitespace-no-wrap data-[chosen]:bg-opacity-50 block w-full bg-[color-mix(in_srgb,transparent,var(--show-color)_calc(var(--tw-bg-opacity,1)*100%))] px-4 py-2 text-white shadow
					ring-white
					[text-shadow:0.035em_0.035em_0px_color-mix(in_srgb,black_50%,var(--show-color)),0.035em_0.07em_0px_color-mix(in_srgb,black_50%,var(--show-color)),0_0_4px_color-mix(in_srgb,black_50%,var(--show-color))]
					hover:ring-4 data-[chosen]:cursor-not-allowed data-[chosen]:ring data-[chosen]:ring-white"
			>
				{choice?.longTitle ?? "None"}
			</button>
		{/each}
	</div>
</div>
