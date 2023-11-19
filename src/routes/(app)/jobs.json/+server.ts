import postsData from "../jobs/_posts-metadata"
import type { RequestHandler } from "@sveltejs/kit"

export const prerender = true

export const GET: RequestHandler = () => {
	return new Response(JSON.stringify(postsData.reverse()))
}
