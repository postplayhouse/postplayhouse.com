import { error } from "@sveltejs/kit"
import type { LayoutLoad } from "./$types"
import type SiteData from "$data/site"

export const prerender = true

export const load: LayoutLoad<{
  site: typeof SiteData
  yaml: YearlyData
}> = async (evt) => {
  const data = await evt.fetch("/data.json")

  if (data.status !== 200)
    throw error(500, "could not fetch main site data.json")

  return data.json() as Promise<{
    site: typeof SiteData
    yaml: YearlyData
  }>
}
