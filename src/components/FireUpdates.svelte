<script lang="ts" module>
	import { dev } from "$app/environment"
	import { toCamel } from "$helpers"
	import { captureException } from "@sentry/sveltekit"
	import { marked } from "marked"
	import { onMount } from "svelte"
	import papa from "papaparse"

	marked.setOptions({ smartypants: true })

	// The published Post Playhouse "South Fork Fire Updates" sheet. The first
	// row is treated as a header. Columns are matched by prefix, so the actual
	// header text can carry notes (e.g. "Time (Mountain)") as long as each one
	// *starts with* "Date", "Time", or "Message".
	const SHEET =
		"https://docs.google.com/spreadsheets/d/1r3rZwJpzA79OVPd06rNPyLFdCt5nZSA0QYTg8eabPYc"
	const CSV_URL = `${SHEET}/export?format=csv&gid=0`

	const TEN_MINUTES = 10 * 60 * 1000

	type Update = {
		date: string
		time: string
		message: string
	}

	async function fetchUpdates(): Promise<Update[]> {
		const res = await fetch(CSV_URL)
		const text = await res.text()

		const rows = papa.parse<Update>(text, {
			header: true,
			skipEmptyLines: true,
			transformHeader(header) {
				const normalized = header.trim().toLowerCase()
				if (normalized.startsWith("date")) return "date"
				if (normalized.startsWith("time")) return "time"
				if (normalized.startsWith("message")) return "message"
				return toCamel(header).trim()
			},
			transform(value) {
				return value.trim()
			},
		}).data

		return rows
			.filter((row) => row.message)
			.sort((a, b) => timestamp(b) - timestamp(a))
	}

	/** Build a sortable value from a row's date + time. Unparseable rows sort last. */
	function timestamp(row: Update): number {
		const value = new Date(`${row.date} ${row.time}`).getTime()
		return Number.isNaN(value) ? -Infinity : value
	}

	/** "5:00:00 PM" -> "5:00 PM MT"; falls back to the raw value if unparseable. */
	function formatTime(row: Update): string {
		if (!row.time) return ""
		const date = new Date(`${row.date} ${row.time}`)
		if (Number.isNaN(date.getTime())) return row.time
		const time = date.toLocaleTimeString([], {
			hour: "numeric",
			minute: "2-digit",
		})
		return `${time} MT`
	}

	/**
	 * Split a message into paragraphs on the line breaks typed into the cell.
	 * Each paragraph is rendered as inline markdown, so **bold**, *italic*, and
	 * [links](…) typed into the sheet come through (cell formatting like bold
	 * text or color does NOT survive Google's CSV export — only the text does).
	 */
	function paragraphs(message: string): string[] {
		return message
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => marked.parseInline(line) as string)
	}
</script>

<script lang="ts">
	let updates = $state<Update[]>([])

	async function refresh() {
		try {
			updates = await fetchUpdates()
		} catch (error) {
			dev ? console.error(error) : captureException(error)
		}
	}

	onMount(() => {
		refresh()
		const interval = setInterval(refresh, TEN_MINUTES)
		return () => clearInterval(interval)
	})
</script>

{#if updates.length > 0}
	<div
		class="mx-auto mb-16 block max-w-2xl border border-amber-400 bg-amber-50 p-6 shadow-md dark:border-amber-500 dark:bg-amber-900/20"
	>
		<h1 class="h2 mb-2">South Fork Fire Updates</h1>

		{#snippet bulletin(update: Update)}
			<li class="space-y-2 py-3 first:pt-0 last:pb-0">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					{update.date}{#if update.time}&nbsp;·&nbsp;{formatTime(update)}{/if}
				</p>
				{#each paragraphs(update.message) as html}
					<p>{@html html}</p>
				{/each}
			</li>
		{/snippet}

		<ul class="divide-y divide-amber-300 dark:divide-amber-700">
			{@render bulletin(updates[0])}
		</ul>

		{#if updates.length > 1}
			<details class="mt-2">
				<summary class="cursor-pointer text-sm font-medium">
					Show previous updates ({updates.length - 1})
				</summary>
				<ul class="mt-2 divide-y divide-amber-300 dark:divide-amber-700">
					{#each updates.slice(1) as update (update.date + update.time + update.message)}
						{@render bulletin(update)}
					{/each}
				</ul>
			</details>
		{/if}
	</div>
{/if}
