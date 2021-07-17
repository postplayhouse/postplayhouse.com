import postsData from "./_posts-metadata"
import type { RequestHandler } from "@sveltejs/kit"

const contents = postsData
  .reverse()
  .map(({ title, slug, date }) => ({ title, slug, date }))

export const get: RequestHandler = () => {
  return { body: contents }
}
