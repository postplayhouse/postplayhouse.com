<script lang="ts">
	import { dev } from "$app/environment"
	import { createThemeStore } from "$helpers/stores.svelte"

	const theme = createThemeStore()

	const resolvedTheme = $derived(theme.getResolvedTheme())
	const label = $derived(theme.value === "system" ? "System" : "Inverted")
</script>

{#if dev}
<button
	type="button"
	onclick={() => theme.toggle()}
	class="pointer-events-auto fixed right-4 bottom-4 z-[9999] flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-sm shadow-lg hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
	title="Theme: {label} ({resolvedTheme}) - click to toggle"
	aria-label="Toggle theme, currently {label}"
>
	{#if resolvedTheme === "light"}
		<!-- Sun icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="4"></circle>
			<path d="M12 2v2"></path>
			<path d="M12 20v2"></path>
			<path d="m4.93 4.93 1.41 1.41"></path>
			<path d="m17.66 17.66 1.41 1.41"></path>
			<path d="M2 12h2"></path>
			<path d="M20 12h2"></path>
			<path d="m6.34 17.66-1.41 1.41"></path>
			<path d="m19.07 4.93-1.41 1.41"></path>
		</svg>
	{:else}
		<!-- Moon icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
		</svg>
	{/if}
	<span class="hidden xs:inline">{label}</span>
</button>
{/if}
