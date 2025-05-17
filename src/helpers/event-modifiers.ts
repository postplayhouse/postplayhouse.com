// Svelte 5 runes prevents the use of event modifiers. Instead, here they are as transcribed from
// https://github.com/sveltejs/svelte/blob/1784026843d2f7de6e449a5587da5dc30d467818/packages/svelte/src/internal/client/dom/legacy/event-modifiers.js#L4

/**
 * Invoke the callback only if the target is the current element. For example,
 * use this on the click of an overlay element so that the callback is not
 * invoked when the user clicks on a child element.
 *
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
