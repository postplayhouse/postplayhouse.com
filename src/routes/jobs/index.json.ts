import postsData from "./_posts-metadata"
import type { RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = () => {
  return { body: postsData.reverse() }
}
