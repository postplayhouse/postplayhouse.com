// Svelte 5 runes prevents the use of event modifiers. Instead, here they are as transcribed from
// https://github.com/sveltejs/svelte/blob/1784026843d2f7de6e449a5587da5dc30d467818/packages/svelte/src/internal/client/dom/legacy/event-modifiers.js#L4

/**
 * @param {(event: Event, ...args: Array<unknown>) => void} fn
 * @returns {(event: Event, ...args: unknown[]) => void}
 */
export function self(
	fn: (event: Event, ...args: Array<unknown>) => void,
): (event: Event, ...args: unknown[]) => void {
	return function (this: HTMLElement, ...args) {
		const event = args[0]

		if (event.target === this) {
			fn.apply(this, args)
		}
	}
}