import marked from "marked"

import postsData from "../_posts-metadata"
import site from "../../../data/site"

export const professionalsPage = `${site.url}/jobs`

export const feedUpdatedDate = new Date().toISOString()

export const feed = {
  updatedDate: new Date().toISOString(),
  htmlLink: professionalsPage,
  title: "Post Playhouse Job Openings and Auditions",
  description:
    "Though the latest information is available on the site, we update this feed when new job opportunities and auditions are announced.",
  feedsUrlBase: `${professionalsPage}/feeds`,
  icon: `${site.url}/${site.icon}`,
}

const dateInNebraska = (dateArg) =>
  new Date(dateArg).toISOString().replace("Z", "-07:00")

export const posts = postsData
  .filter((post) => ((post as unknown) as { feed: boolean }).feed)
  .map((post) => {
    return {
      author: { name: "Post Playhouse" },
      title: post.title,
      id: `${professionalsPage}/${post.year}`,
      publishedDate: dateInNebraska(post.date),
      updatedDate: dateInNebraska(post.updatedDate || post.date),
      html: marked(
        post.content +
          `\n\nVisit our site for the [full job listing](${professionalsPage})`,
      ),
    }
  })
