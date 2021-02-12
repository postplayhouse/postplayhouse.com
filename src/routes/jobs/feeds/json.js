import { posts, feed } from "./_feed"

const jsonFeedPage = `${feed.feedsUrlBase}/json`

const renderJsonFeed = (posts) =>
  JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    title: feed.title,
    icon: feed.icon,
    home_page_url: feed.htmlLink,
    description: feed.description,
    feed_url: jsonFeedPage,
    items: posts.map((post) => ({
      id: post.id,
      title: post.title,
      date_published: post.publishedDate,
      date_modified: post.updatedDate,
      content_html: post.html,
      url: feed.htmlLink,
    })),
  })

export function get(req, res) {
  res.writeHead(200, {
    "Content-Type": "application/feed+json",
  })

  res.end(renderJsonFeed(posts))
}
