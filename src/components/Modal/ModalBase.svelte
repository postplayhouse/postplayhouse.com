<script lang="ts">
	import { self } from "$helpers/event-modifiers"
	import type { Snippet } from "svelte"

	type Props = {
		transitionedOut?: boolean
		onClose?: () => void
		children: Snippet
	}

	let { transitionedOut = false, onClose, children }: Props = $props()
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="my-bg xs:p-4 fixed overflow-y-auto shadow-md
{transitionedOut ? 'disappear' : 'inset-0'}"
	onclick={self(() => onClose?.())}
>
	<section
		class="xs:relative xs:inset-auto xs:mx-auto xs:min-h-0 xs:max-w-lg xs:border-4 absolute inset-0 bottom-auto
      block min-h-full border-6 border-solid
      border-green-600 bg-white px-4 py-6 dark:bg-[#0f110f] dark:text-white
      "
	>
		<button
			class="btn xs:absolute xs:mr-2 xs:mt-2 fixed top-0 right-0
        z-10 mt-4 mr-4
        px-2 py-1 leading-none"
			onclick={onClose}
		>
			Close
		</button>

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
