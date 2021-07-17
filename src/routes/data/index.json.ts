import site from "../../data/site"
import data from "../../data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"

export const get: RequestHandler = (_req) => ({
  body: { site, data },
})
