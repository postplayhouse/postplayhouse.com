import marked from "marked"

import postsData from "./_posts-metadata"
import data from "../../data/site"

const professionalsPage = `${data.url}/industry-professionals`
const rssFeedPage = `${professionalsPage}/rss`
const renderXmlRssFeed = (posts) => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Post Playhouse Job Openings and Auditions</title>
  <link rel="alternate" type="text/html>${professionalsPage}</link>
  <link rel="self" type="application/atom+xml">${rssFeedPage}</link>
  <id>${rssFeedPage}</id>
  <description>Though the latest information is available on the site, we update this feed when new job opportunities and auditions are announced.</description>
  <updated>${new Date().toUTCString()}</updated>
  ${posts
    .map(
      (item) => `
    <entry>
      <title>${item.title}</title>
      <link rel="related" type="text/html">${professionalsPage}/industry-professionals</link>
      <id>${item.slug}</id>
      <content type="html"><![CDATA[${item.html}]]></content>
      <published>${new Date(item.date).toUTCString()}</published>
    </entry>`,
    )
    .join("\n")}
</feed>`

export function get(req, res) {
  res.writeHead(200, {
    "Cache-Control": `max-age=0, s-max-age=${600}`, // 10 minutes
    "Content-Type": "application/rss+xml",
  })

  const posts = postsData
    .filter((p) => p.active == true)
    .map((post) => {
      return {
        ...post,
        html: marked(
          post.content +
            `\n\nVisit our site for the [full job listing](${professionalsPage})`,
        ),
      }
    })
  const feed = renderXmlRssFeed(posts)
  res.end(feed)
}
