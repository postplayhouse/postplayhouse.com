import type { PageLoad } from "./$types"

const disabled = false

// When disabled, prevent hydration
export const csr = !disabled

export const load: PageLoad = async () => {
  return { disabled }
}
