import { error } from "@sveltejs/kit"
import type { PageLoad } from "./$types"
throw new Error(
  "@migration task: Check if you need to migrate the load function input (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)",
)
export const load: PageLoad = async (obj) => {
  const year = parseInt(obj.params["year"] as string)
  const res = await obj.fetch(`/data/productions/${year}.json`)
  const data = await res.json()

  if (res.status === 200) {
    return {
      productions: data.productions,
      year,
    }
  } else {
    throw error(500, data.message)
  }
}
