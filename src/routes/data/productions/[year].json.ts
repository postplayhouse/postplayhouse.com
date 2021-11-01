import site from "../../../data/site"
import data from "../../../data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"

export const get: RequestHandler = (req) => {
  return {
    body: {
      site,
      productions: data.productions[req.params["year"]] || [],
    },
  }
}
