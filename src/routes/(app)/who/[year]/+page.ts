import { error } from "@sveltejs/kit"
import type { PageLoad } from "./$types"

export const load: PageLoad = async (obj) => {
  const res = await obj.fetch(`/data/people/${obj.params["year"]}.json`)
  const data = await res.json()

  if (res.status === 200) {
    return {
      site: data.site,
      people: data.people as YamlPerson[],
      year: obj.params["year"],
    }
  } else {
    throw error(500, data.message)
  }
}
