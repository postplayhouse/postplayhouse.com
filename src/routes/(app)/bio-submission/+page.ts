const disabled = false

// When disabled, prevent hydration
export const csr = !disabled

export async function load() {
	return { disabled }
}
