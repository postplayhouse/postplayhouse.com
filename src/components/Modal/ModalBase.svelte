<script lang="ts">
	import { self } from "$helpers/event-modifiers"
	import type { Snippet } from "svelte"

	type Props = {
		transitionedOut?: boolean
		dispatch: (evtName: string) => void
		children: Snippet
	}

	let { transitionedOut = false, dispatch, children }: Props = $props()
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed shadow-md my-bg overflow-y-auto xs:p-4
{transitionedOut ? 'disappear' : 'inset-0'}"
	onclick="{self(() => dispatch('close'))}"
>
	<section
		class="absolute bg-white dark:bg-[#0f110f] dark:text-white border-green-600 border-solid block px-4 py-6
      border-6 inset-0 bottom-auto min-h-full
      xs:relative xs:mx-auto xs:border-4 xs:inset-auto xs:min-h-0 xs:max-w-lg
      "
	>
		<button
			class="btn py-1 px-2 leading-none top-0 right-0 z-10
        fixed mt-4 mr-4
        xs:absolute xs:mt-2 xs:mr-2"
			onclick="{() => dispatch('close')}"
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
