import { json } from "@sveltejs/kit"

import postsData from "../news/_posts-metadata"
import type { RequestHandler } from "@sveltejs/kit"

export const prerender = true

const contents = postsData
  .reverse()
  .map(({ title, year, date }) => ({ title, year, date }))

export const GET: RequestHandler = () => {
  return json(contents)
}
