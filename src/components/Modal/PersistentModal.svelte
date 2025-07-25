<script lang="ts">
	/**
	 * Like the regular modal, except the showing and hiding is all done via the
	 * `show` prop. And the contents of the modal are always loaded into the DOM.
	 * This allows forms to not lose data after closing, etc.
	 */
	import debounce from "lodash-es/debounce.js"
	import { type Snippet } from "svelte"

	import Freeze from "../Freeze.svelte"
	import { mountInPortal, type LifecycleRef } from "./modal"
	import ModalBase from "./ModalBase.svelte"

	interface Props {
		show: boolean
		children: Snippet
		onClose: Callback
	}

	let { show, children, onClose }: Props = $props()

	let ref: LifecycleRef<HTMLDivElement> = { current: null }

	mountInPortal(ref, "persistent-modal")

	let transitionedOut = $state(false)
	const delayedTransition = debounce(() => (transitionedOut = !show), 200)

	$effect(() => {
		if (show) {
			transitionedOut = false
		} else {
			delayedTransition()
		}
	})
</script>

{#if show}
	<Freeze />
{/if}

<!-- the parent is hidden, but the child with the `ref` will be appended
elsewhere in the DOM via `onMount` -->
<div class="hidden">
	<div
		class="transition-opacity duration-200 {show ? 'opacity-100' : 'opacity-0'}
    "
		bind:this={ref.current}
	>
		<ModalBase {transitionedOut} {onClose}>
			{@render children()}
		</ModalBase>
	</div>
</div>
