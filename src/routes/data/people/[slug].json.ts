import site from "../../../data/site"
import data from "../../../data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"

export const get: RequestHandler = (req) => {
  return {
    body: { site, people: data.people[req.params.slug] },
  }
}