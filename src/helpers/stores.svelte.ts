export function createIntStore(
	initialValue: number,
	opts?: { localStorageName?: string; min?: number; max?: number },
) {
	const { localStorageName, min, max } = opts || {}

	let int = $state(initialValue)

	if (localStorageName) {
		try {
			const storedValue = localStorage.getItem(localStorageName)
			if (storedValue) {
				int = Number.parseInt(storedValue)
			}
		} catch {
			// noop
		}

		$effect(() => {
			console.log("storing")
			try {
				localStorage.setItem(localStorageName, int.toString())
			} catch {
				// noop
			}
		})
	}

	return {
		get value() {
			return int
		},
		increment:
			typeof max === "number"
				? () => {
						int = int >= max ? max : int + 1
					}
				: () => {
						int++
					},
		decrement:
			typeof min === "number"
				? () => {
						int = int <= min ? min : int - 1
					}
				: () => {
						int--
					},
	}
}
