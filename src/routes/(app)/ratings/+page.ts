import { error } from "@sveltejs/kit"
import type { PageLoad } from "./$types"
import siteData from "$data/site"

export const load: PageLoad = async (obj) => {
  const productionRes = await obj.fetch(
    `/data/productions/${siteData.season}.json`,
  )
  const data = await productionRes.json()
  if (productionRes.status !== 200) throw error(500, data.message)

  return {
    productions: data.productions as Production[],
  }
}
