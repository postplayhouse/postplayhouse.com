import type { PageLoad } from "./$types"
throw new Error(
  "@migration task: Check if you need to migrate the load function input (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)",
)
export const load: PageLoad = (obj) => {
  throw new Error(
    "@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)",
  )
  return obj
    .fetch(`/news.json`)
    .then((r) => r.json())
    .then((posts) => {
      return { props: { posts } }
    })
}
