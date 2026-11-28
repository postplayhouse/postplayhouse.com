<script lang="ts">
	import { self } from "$helpers/event-modifiers"
	import type { Snippet } from "svelte"

	type Props = {
		transitionedOut?: boolean
		/** Put Close in a sticky header row so it never covers the content. */
		closeBar?: boolean
		/** Close when the dimmed backdrop is clicked. */
		closeOnBackdrop?: boolean
		onClose?: () => void
		children: Snippet
	}

	let {
		transitionedOut = false,
		closeBar = false,
		closeOnBackdrop = true,
		onClose,
		children,
	}: Props = $props()

	let closeButton: HTMLButtonElement | undefined = $state()

	// Focus Close once the modal has been moved into its portal; moving a
	// focused element drops its focus, so wait until mounting has finished.
	$effect(() => {
		if (!closeBar || !closeButton) return
		const timer = setTimeout(() => closeButton?.focus())
		return () => clearTimeout(timer)
	})
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="my-bg xs:p-4 fixed overflow-y-auto shadow-md
{transitionedOut ? 'disappear' : 'inset-0'}"
	onclick={self(() => {
		if (closeOnBackdrop) onClose?.()
	})}
>
	<section
		class="xs:relative xs:inset-auto xs:mx-auto xs:min-h-0 xs:max-w-lg xs:border-4 absolute inset-0 bottom-auto
      block min-h-full border-6 border-solid
      border-green-600 bg-white px-4 py-6 dark:bg-[#0f110f] dark:text-white
      "
	>
		{#if closeBar}
			<div
				class="sticky top-0 z-10 -mx-4 -mt-6 mb-2 flex justify-end bg-white px-4 py-2 dark:bg-[#0f110f]"
			>
				<button
					bind:this={closeButton}
					class="btn px-2 py-1 leading-none"
					onclick={onClose}
				>
					Close
				</button>
			</div>
		{:else}
			<button
				class="btn xs:absolute xs:mr-2 xs:mt-2 fixed top-0 right-0
        z-10 mt-4 mr-4
        px-2 py-1 leading-none"
				onclick={onClose}
			>
				Close
			</button>
		{/if}

		{@render children()}
	</section>
</div>

<style>
	.my-bg {
		background-color: rgba(0, 0, 0, 0.4);
	}

	.disappear {
		left: -9999rem;
	}
</style>
