import { error } from "@sveltejs/kit"
import type { PageLoad } from "./$types"

export const load: PageLoad = async (obj) => {
  // the `year` parameter is available because
  // this file is called [year].svelte
  const res = await obj.fetch(`data/people.json`)
  const data = await res.json()

  if (res.status === 200) {
    return { seasons: data.seasons }
  } else {
    throw error(500, data.message)
  }
}