import { json } from "@sveltejs/kit"

// @migration task: Check imports
import site from "$data/site"
import data from "$data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = (_req) =>
  json({ site, seasons: data.people })