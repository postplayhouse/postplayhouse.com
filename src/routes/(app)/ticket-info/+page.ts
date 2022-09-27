import { error } from "@sveltejs/kit"
import type { PageLoad } from "@sveltejs/kit"
import siteData from "$data/site"
throw new Error(
  "@migration task: Check if you need to migrate the load function input (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)",
)
export const load: PageLoad = async (obj) => {
  const res = await obj.fetch(`/data/productions/${siteData.season}.json`)
  const data = await res.json()

  if (res.status === 200) {
    return { site: data.site, productions: data.productions }
  } else {
    throw error(500, data.message)
  }
}
