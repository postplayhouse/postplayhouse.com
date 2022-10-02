import { error } from "@sveltejs/kit"
import type { LayoutLoad } from "./$types"

export const prerender = true

export const load: LayoutLoad = async (evt) => {
  const data = await evt.fetch("/data.json")

  if (data.status !== 200)
    throw error(500, "could not fetch main site data.json")

  return data.json()
}
