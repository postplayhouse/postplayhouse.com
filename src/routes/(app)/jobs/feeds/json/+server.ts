import { posts, feed } from "../_feed"
import type { RequestHandler } from "@sveltejs/kit"

const jsonFeedPage = `${feed.feedsUrlBase}/json`

const renderJsonFeed = (posts_: typeof posts) =>
  JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    title: feed.title,
    icon: feed.icon,
    home_page_url: feed.htmlLink,
    description: feed.description,
    feed_url: jsonFeedPage,
    items: posts_.map((post) => ({
      id: post.id,
      title: post.title,
      date_published: post.publishedDate,
      date_modified: post.updatedDate,
      content_html: post.html,
      url: feed.htmlLink,
    })),
  })

export const GET: RequestHandler = () => {
  throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
  // Suggestion (check for correctness before using):
  // return new Response(renderJsonFeed(posts), {
  //   headers: {
  //     "Content-Type": "application/feed+json",
  //   }
  // });
  return {
    headers: {
      "Content-Type": "application/feed+json",
    },
    body: renderJsonFeed(posts),
  }
}
