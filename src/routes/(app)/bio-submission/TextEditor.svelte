<script lang="ts">
	import { EditorView } from "prosemirror-view"
	import "./editor.css"
	import { EditorState } from "prosemirror-state"
	import {
		schema,
		defaultMarkdownParser,
		defaultMarkdownSerializer,
	} from "prosemirror-markdown"
	import { buildMenuItems, exampleSetup } from "prosemirror-example-setup"
	import { onMount } from "svelte"

	export let modeSwitch = false

	export let content =
		"This is a comment written in [Markdown](http://commonmark.org). *You* may know the syntax for inserting a link, but does your whole audience?\n\nSo you can give people the **choice** to use a more familiar, discoverable interface."

	function updateContent(newContent: string) {
		content = newContent
	}

	export let onChange = updateContent

	export let markdown = false

	let editorEl: HTMLDivElement | undefined

	class MarkdownView {
		textarea: HTMLTextAreaElement
		constructor(target: Node, content: string) {
			this.textarea = target.appendChild(document.createElement("textarea"))
			this.textarea.className = "markdown-editor"
			this.textarea.value = content
			this.textarea.addEventListener("input", () => {
				onChange(this.content)
			})
		}

		get content() {
			return this.textarea.value
		}
		focus() {
			this.textarea.focus()
		}
		destroy() {
			this.textarea.remove()
		}
	}

	class ProseMirrorView {
		view: EditorView
		constructor(target: Node, content: string) {
			this.view = new EditorView(target, {
				state: EditorState.create({
					doc: defaultMarkdownParser.parse(content) ?? undefined,
					plugins: exampleSetup({
						schema,
						menuContent: buildMenuItems(schema)
							// the first set of items is all we want...
							.fullMenu.filter((_, i) => i === 0)
							.map((x) => {
								// ... inside there, the even items happen to be italics and links
								return x.filter((_, i) => (i + 1) % 2 === 0)
							}) as Parameters<typeof exampleSetup>[0]["menuContent"],
					}),
				}),
				dispatchTransaction: (transaction) => {
					this.view.updateState(this.view.state.apply(transaction))
					onChange(this.content)
				},
			})
		}

		get content() {
			return defaultMarkdownSerializer.serialize(this.view.state.doc)
		}
		focus() {
			this.view.focus()
		}
		destroy() {
			this.view.destroy()
		}
	}

	let view: {
		content: string
		destroy: () => unknown
		focus: () => unknown
	}

	function handleToggle(e: Event) {
		let button = e.currentTarget as HTMLInputElement
		if (button.value === "markdown" && markdown) return
		if (button.value !== "markdown" && !markdown) return

		if (!editorEl) {
			throw new Error("No place to put the editor on button switch")
		}
		if (!button.checked) return
		markdown = button.value == "markdown"
		let View = markdown ? MarkdownView : ProseMirrorView
		if (view instanceof View) return
		view.destroy()
		view = new View(editorEl, content)
		view.focus()
	}

	onMount(() => {
		if (!editorEl) throw new Error("No place to put the editor")
		view = markdown
			? new MarkdownView(editorEl, content)
			: new ProseMirrorView(editorEl, content)
	})
</script>

{#if modeSwitch}
	<div class="flex justify-end">
		<div class="border border-b-0 relative top-1 rounded-t-md overflow-clip">
			<label class="p-2 pb-3 has-[:checked]:bg-emerald-300 inline-block"
				><input
					class="invisible h-0 w-0"
					on:change="{handleToggle}"
					type="radio"
					name="inputformat"
					value="markdown"
					checked="{markdown}"
				/>
				Nerd town (Markdown)
			</label><label
				class="border-r border-black/30 p-2 pb-3 has-[:checked]:bg-emerald-300 inline-block"
			>
				Regular Editor
				<input
					class="invisible h-0 w-0"
					on:change="{handleToggle}"
					type="radio"
					name="inputformat"
					value="prosemirror"
					checked="{!markdown}"
				/></label
			>
		</div>
	</div>
{/if}

<div class="editor-thing relative">
	{#if markdown}
		<div
			class="absolute left-0 right-0 px-4 py-2 text-sm top-0 z-10 text-slate-200 bg-slate-600 rounded-t"
		>
			If you don't know <a
				href="https://commonmark.org/help/"
				target="_blank"
				class="underline">what markdown is</a
			>, you probably want the regular editor.
		</div>
	{/if}
	<div
		bind:this="{editorEl}"
		class="editor bg-white rounded border-2 border-black/20 py-[5px] relative"
	></div>
</div>

<style>
	.editor :global(.markdown-editor) {
		padding: 1em;
		padding-top: 3em;
		margin: 0;
		width: 100%;
		min-height: 220px;
		outline: none;
		font-family: monospace;
	}
</style>
