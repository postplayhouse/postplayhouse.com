import { error } from "@sveltejs/kit"

export async function load(obj) {
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
