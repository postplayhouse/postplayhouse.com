import { posts, feed } from "../_feed"
import type { RequestHandler } from "@sveltejs/kit"

export const prerender = true

const rssFeedPage = `${feed.feedsUrlBase}/rss`

const renderXmlRssFeed = (
	posts_: typeof posts,
) => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${feed.title}</title>
  <icon>${feed.icon}</icon>
  <link rel="alternate" type="text/html" href="${feed.htmlLink}" />
  <link rel="self" type="application/atom+xml" href="${rssFeedPage}" />
  <id>${rssFeedPage}</id>
  <updated>${feed.updatedDate}</updated>
  ${posts_
		.map(
			(item) => `
    <entry>
      <title>${item.title}</title>
      <author><name>${item.author.name}</name></author>
      <link rel="related" type="text/html" href="${feed.htmlLink}" />
      <id>${item.id}</id>
      <content type="html"><![CDATA[${item.html}]]></content>
      <published>${item.publishedDate}</published>
      <updated>${item.updatedDate}</updated>
    </entry>`,
		)
		.join("\n")}
</feed>`

export const GET: RequestHandler = () => {
	return new Response(renderXmlRssFeed(posts), {
		headers: { "Content-Type": "application/rss+xml" },
	})
}
