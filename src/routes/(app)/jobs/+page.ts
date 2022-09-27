import type { PageLoad } from "./$types"

type Post = {
  content: string
  title: string
  website: boolean
  feed: boolean
}

export const load: PageLoad = async (obj) => {
  const r = await obj.fetch(`/jobs.json`)
  const posts = (await r.json()) as Post[]
  return { posts: posts.filter((p) => p.website) }
}
