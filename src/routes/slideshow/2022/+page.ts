import { error } from '@sveltejs/kit';
import type { PageLoad } from "@sveltejs/kit"
import { marked } from "marked"

marked.setOptions({ smartypants: true })

throw new Error("@migration task: Check if you need to migrate the load function input (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
export const load: PageLoad = async (obj) => {
  const peopleRes = await obj.fetch(`/data/people/2022.json`)
  const peopleData = await peopleRes.json()
  if (peopleRes.status !== 200)
    throw error(500, peopleData.message);

  return {
  people: peopleData.people,
}
}
