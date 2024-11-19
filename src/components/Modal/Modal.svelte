<script lang="ts">
	interface Props {
		children?: import("svelte").Snippet
	}

	let { children }: Props = $props()
	import { createEventDispatcher } from "svelte"
	import { fade } from "svelte/transition"

	import Freeze from "../Freeze.svelte"
	import { mountInPortal, type LifecycleRef } from "./modal"
	import ModalBase from "./ModalBase.svelte"

	const dispatch = createEventDispatcher()

	let ref: LifecycleRef<HTMLDivElement> = $state({ current: null })

	mountInPortal(ref, "modal")
</script>

<Freeze />

<!-- the parent is hidden, but the child with the `ref` will be appended
elsehwere in the DOM via `onMount` -->
<div class="hidden">
	<div bind:this={ref.current} transition:fade={{ duration: 200 }}>
		<ModalBase {dispatch}>
			{@render children?.()}
		</ModalBase>
	</div>
</div>
