<script lang="ts">
	import { browser } from "$app/environment"

	const rootVars = $derived.by(() => {
		const rootVars = new Set(browser ? [] : ["green"])
		const sheets = browser ? Array.from(document.styleSheets) : []
		for (const sheet of sheets) {
			try {
				for (const rule of sheet.cssRules) {
					const cssText = rule.cssText
					const matches = [...cssText.matchAll(/--color-([a-z]+)-[0-9]*\s*:/g)]
					for (const match of matches) {
						rootVars.add(match[1])
					}
				}
			} catch {
				continue
			}
		}
		return rootVars
	})
</script>

{#each rootVars as name}
	<div class="grid auto-cols-fr grid-flow-col">
		{#each ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as value}
			<div>
				<div class="unused-bg relative size-12">
					<div
						style="background-color: var(--color-{name}-{value});"
						class="absolute inset-0"
					></div>
				</div>
				<code>bg-{name}-{value}</code>
			</div>
		{/each}
	</div>
{/each}

<style lang="postcss">
	@reference "../../../app.css";

	.unused-bg {
		@apply inset-ring inset-ring-gray-300;
		background:
			linear-gradient(
				45deg,
				transparent 49%,
				var(--tw-inset-ring-color) 50%,
				transparent 51%
			),
			linear-gradient(
				-45deg,
				transparent 49%,
				var(--tw-inset-ring-color) 50%,
				transparent 51%
			);
		background-size: 100% 100%;
		background-repeat: no-repeat;
	}
</style>
