import { json } from "@sveltejs/kit"

import * as site from "$data/site"
import data from "$data/_yaml"
import type { RequestHandler } from "@sveltejs/kit"

export const prerender = true

export const GET: RequestHandler = (_req) =>
	json({ site, seasons: data.people })
