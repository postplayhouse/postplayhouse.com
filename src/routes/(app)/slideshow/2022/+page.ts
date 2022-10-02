import { error } from "@sveltejs/kit"
import type { PageLoad } from "./$types"

export const load: PageLoad = async (obj) => {
  const peopleRes = await obj.fetch(`/data/people/2022.json`)
  const peopleData = await peopleRes.json()
  if (peopleRes.status !== 200) throw error(500, peopleData.message)

  return {
    people: peopleData.people,
  }
}
