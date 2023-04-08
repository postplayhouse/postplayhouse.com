import { error } from "@sveltejs/kit"

export async function load(obj) {
  const year = parseInt(obj.params["year"] as string) as Date.Year
  const res = await obj.fetch(`/data/productions/${year}.json`)
  const data = await res.json()

  if (res.status === 200) {
    return {
      productions: data.productions as Production[],
      year,
    }
  } else {
    throw error(500, data.message)
  }
}
