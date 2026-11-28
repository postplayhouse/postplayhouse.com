<script lang="ts">
	/**
	 * A Donate button that opens the box office donation form in a modal. It is
	 * a real link to the full-page form, so middle-clicks, modified clicks and
	 * no-JavaScript visitors open the form in a new tab instead.
	 */
	import type { Snippet } from "svelte"
	import Modal from "$components/Modal/Modal.svelte"
	import {
		donateEmbedHosts,
		donateEmbedUrl,
		donatePageUrl,
		doneMessageType,
		heightMessageType,
		type DonateEmbedHost,
	} from "./donate-embed"

	type Props = {
		host?: DonateEmbedHost
		onDone?: () => void
		children?: Snippet
	}
	let { host = "production", onDone, children }: Props = $props()

	const startingHeight = 760

	const src = $derived(donateEmbedUrl(host))
	const pageHref = $derived(donatePageUrl(host))
	let open = $state(false)
	let height = $state(startingHeight)
	let iframe: HTMLIFrameElement | undefined = $state()
	let link: HTMLAnchorElement | undefined = $state()

	function onclick(event: MouseEvent) {
		if (
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		)
			return
		event.preventDefault()
		height = startingHeight
		open = true
	}

	function close() {
		open = false
		link?.focus()
	}

	function onkeydown(event: KeyboardEvent) {
		if (open && event.key === "Escape") close()
	}

	function onmessage(event: MessageEvent) {
		if (!open || !iframe) return
		if (event.origin !== donateEmbedHosts[host]) return
		if (event.source !== iframe.contentWindow) return

		const data = event.data
		if (data?.type === heightMessageType) {
			const next = Number(data.height)
			if (Number.isFinite(next) && next > 0) height = Math.ceil(next)
		} else if (data?.type === doneMessageType) {
			// Keep the modal open so the donor sees the thank-you.
			onDone?.()
		}
	}
</script>

<svelte:window {onkeydown} {onmessage} />

<div class="my-8 flex items-center justify-center">
	<a
		bind:this={link}
		href={pageHref}
		target="_blank"
		rel="noopener noreferrer"
		class="btn btn-p inline-block"
		{onclick}
		>{#if children}{@render children()}{:else}Donate Online Now{/if}</a
	>
</div>

{#if open}
	<Modal onClose={close} closeBar closeOnBackdrop={false}>
		<iframe
			bind:this={iframe}
			{src}
			title="Donate to Post Playhouse"
			allow="payment"
			class="block w-full border-0"
			style:height="{height}px"
		></iframe>
	</Modal>
{/if}
