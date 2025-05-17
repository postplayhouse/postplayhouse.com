<script lang="ts">
	import { fade } from "svelte/transition"

	import Freeze from "../Freeze.svelte"
	import { mountInPortal, type LifecycleRef } from "./modal"
	import ModalBase from "./ModalBase.svelte"

	interface Props {
		onClose?: () => void
		children?: import("svelte").Snippet
	}

	let { children, onClose }: Props = $props()

	let ref: LifecycleRef<HTMLDivElement> = $state({ current: null })

	mountInPortal(ref, "modal")
</script>

<Freeze />

<!-- the parent is hidden, but the child with the `ref` will be appended
elsewhere in the DOM via `onMount` -->
<div class="hidden">
	<div bind:this={ref.current} transition:fade={{ duration: 200 }}>
		<ModalBase {onClose}>
			{@render children?.()}
		</ModalBase>
	</div>
</div>
