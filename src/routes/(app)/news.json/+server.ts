import { json } from "@sveltejs/kit"

// @migration task: Check imports
import postsData from "../news/_posts-metadata"
import type { RequestHandler } from "@sveltejs/kit"

const contents = postsData
  .reverse()
  .map(({ title, year, date }) => ({ title, year, date }))

export const GET: RequestHandler = () => {
  return json(contents)
}