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

export type Theme = "system" | "opposite"

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light"
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light"
}

function applyTheme(theme: Theme) {
	if (typeof document === "undefined") return

	const systemTheme = getSystemTheme()
	const resolved =
		theme === "system" ? systemTheme : systemTheme === "dark" ? "light" : "dark"

	if (resolved === "dark") {
		document.documentElement.classList.add("dark")
	} else {
		document.documentElement.classList.remove("dark")
	}
}

function loadTheme(): Theme {
	try {
		const stored = localStorage.getItem("theme") as Theme | null
		if (stored && ["system", "opposite"].includes(stored)) {
			return stored
		}
	} catch {
		// noop
	}
	return "system"
}

function saveTheme(theme: Theme) {
	try {
		localStorage.setItem("theme", theme)
	} catch {
		// noop
	}
}

export function createThemeStore() {
	let theme = $state<Theme>(loadTheme())

	// Apply initial theme
	applyTheme(theme)

	// Listen for system preference changes
	$effect(() => {
		if (typeof window === "undefined") return

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
		const handler = () => applyTheme(theme)
		mediaQuery.addEventListener("change", handler)
		return () => mediaQuery.removeEventListener("change", handler)
	})

	return {
		get value() {
			return theme
		},
		toggle() {
			theme = theme === "system" ? "opposite" : "system"
			applyTheme(theme)
			saveTheme(theme)
		},
		getResolvedTheme(): "light" | "dark" {
			const systemTheme = getSystemTheme()
			return theme === "system"
				? systemTheme
				: systemTheme === "dark"
					? "light"
					: "dark"
		},
	}
}
