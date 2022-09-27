import { error } from "@sveltejs/kit"
import type { PageLoad } from "./$types"

export const load: PageLoad = async (obj) => {
  const res = await obj.fetch(`data/businesses.json`)
  const data = await res.json()

  if (res.status === 200) {
    return { businesses: data.businesses as Business[] }
  } else {
    throw error(500, data.message)
  }
}
