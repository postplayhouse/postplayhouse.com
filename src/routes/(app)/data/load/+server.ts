import type { Load } from "@sveltejs/kit"
export const load: Load = (obj) => {
  return obj
    .fetch(`/data.json`)
    .then((r) => r.json())
    .then((data) => {
      return { props: { site: data } }
    })
}
