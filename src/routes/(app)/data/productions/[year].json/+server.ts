import { json } from "@sveltejs/kit"
import site from "$data/site"
import data from "$data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"

export const prerender = true

export const GET: RequestHandler = (req) => {
  return json({
    site,
    productions: data.productions[req.params["year"] as string] || [],
  })
}
