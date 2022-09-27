
// @migration task: Check imports
import postsData from "./_posts-metadata"
import type { RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = () => {
  throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
  // Suggestion (check for correctness before using):
  // return new Response(postsData.reverse());
  return { body: postsData.reverse() }
}
