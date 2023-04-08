import { error } from "@sveltejs/kit"
import site from "$data/site"

const currentYear = new Date().getFullYear()
const seasonYear = site.season

export async function load(obj) {
  if (currentYear !== seasonYear) return { productions: [] }

  const res = await obj.fetch(`/data/productions/${currentYear}.json`)
  const data = await res.json()

  if (res.status === 200) {
    return {
      productions: data.productions,
    }
  } else {
    throw error(500, `could not fetch /data/productions/${currentYear}.json`)
  }
}
