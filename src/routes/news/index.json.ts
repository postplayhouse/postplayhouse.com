import postsData from "./_posts-metadata"
import type { RequestHandler } from "@sveltejs/kit"

const contents = postsData
  .reverse()
  .map(({ title, year, date }) => ({ title, year, date }))

export const get: RequestHandler = () => {
  return { body: contents }
}
