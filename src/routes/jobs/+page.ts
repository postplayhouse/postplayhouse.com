import type { PageLoad } from "@sveltejs/kit"

type Post = {
  content: string
  title: string
  website: boolean
  feed: boolean
}

throw new Error("@migration task: Check if you need to migrate the load function input (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
export const load: PageLoad = (obj) => {
  throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
  return obj
    .fetch(`/jobs.json`)
    .then((r) => r.json())
    .then((posts: Post[]) => {
      return { props: { posts: posts.filter((p) => p.website) } }
    })
}
