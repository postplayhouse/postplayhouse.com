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

	function updateContent(newContent: string) {
		content = newContent
	}

	type Props = {
		content: string
		onChange: (newContent: string) => void
		markdown?: boolean
		modeSwitch?: boolean
	}

	let {
		content = "This is a comment written in [Markdown](http://commonmark.org). *You* may know the syntax for inserting a link, but does your whole audience?\n\nSo you can give people the **choice** to use a more familiar, discoverable interface.",
		onChange = updateContent,
		markdown = false,
		modeSwitch = false,
	}: Props = $props()

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
		<div class="relative top-1 overflow-clip rounded-t-md border border-b-0">
			<label class="inline-block p-2 pb-3 has-checked:bg-emerald-300"
				><input
					class="invisible h-0 w-0"
					onchange={handleToggle}
					type="radio"
					name="inputformat"
					value="markdown"
					checked={markdown}
				/>
				Nerd town (Markdown)
			</label><label
				class="inline-block border-r border-black/30 p-2 pb-3 has-checked:bg-emerald-300"
			>
				Regular Editor
				<input
					class="invisible h-0 w-0"
					onchange={handleToggle}
					type="radio"
					name="inputformat"
					value="prosemirror"
					checked={!markdown}
				/></label
			>
		</div>
	</div>
{/if}

<div class="editor-thing relative">
	{#if markdown}
		<div
			class="absolute top-0 right-0 left-0 z-10 rounded-t bg-slate-600 px-4 py-2 text-sm text-slate-200"
		>
			If you don't know <a
				href="https://commonmark.org/help/"
				target="_blank"
				class="underline">what markdown is</a
			>, you probably want the regular editor.
		</div>
	{/if}
	<div
		bind:this={editorEl}
		class="editor relative rounded-sm border-2 border-black/20 bg-white py-[5px] dark:bg-white/20"
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
