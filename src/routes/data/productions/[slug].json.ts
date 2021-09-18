import site from "../../../data/site"
import data from "../../../data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"

export const get: RequestHandler = (req) => {
  // console.log(req.params["slug"])
  // console.log(typeof req.params["slug"])
  // console.log(data.productions[req.params["slug"]])
  return {
    body: {
      site,
      productions: data.productions[req.params["slug"]] || [],
    },
  }
}
