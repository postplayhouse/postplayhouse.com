import { error } from "@sveltejs/kit"
import type { PageLoad } from "@sveltejs/kit"
import site from "$data/site"

throw new Error(
  "@migration task: Check if you need to migrate the load function input (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)",
)
export const load: PageLoad = async (obj) => {
  const res = await obj.fetch(`/data/productions/${obj.params["year"]}.json`)
  const data = await res.json()

  if (res.status === 200) {
    return {
      productions: data.productions,
      year: parseInt(obj.params["year"] as string),
    }
  } else {
    throw error(
      500,
      `could not fetch /data/productions/${obj.params["year"]}.json`,
    )
  }
}
