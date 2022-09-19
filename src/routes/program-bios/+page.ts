import { error } from '@sveltejs/kit';
import type { PageLoad } from "@sveltejs/kit"
import { type Person, toPerson } from "../../models/Person"
import site from "../../data/site"
import { marked } from "marked"

marked.setOptions({ smartypants: true })

throw new Error("@migration task: Check if you need to migrate the load function input (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
export const load: PageLoad = async (obj) => {
  const peopleRes = await obj.fetch(`/data/people/${site.season}.json`)
  const peopleData = await peopleRes.json()
  if (peopleRes.status !== 200)
    throw error(500, peopleData.message);

  const productionsRes = await obj.fetch(
    `/data/productions/${site.season}.json`,
  )
  const productionsData = await productionsRes.json()
  if (productionsRes.status !== 200)
    throw error(500, productionsData.message);

  return {
  people: peopleData.people,
  productions: productionsData.productions,
}
}
