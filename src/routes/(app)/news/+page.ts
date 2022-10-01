import type { PageLoad } from "./$types"
export const load: PageLoad = async (obj) => {
  const r = await obj.fetch(`/news.json`)
  const posts: Array<{ title: string; year: string; date: string }> =
    await r.json()
  return { posts }
}
