import { postsMetadata } from "$helpers/blog-dir-metadata"
import site from "$data/site"

export default postsMetadata("src/routes/(app)/jobs/").map((post) => ({
  ...post,
  content: post.content.replace(/__URL__/g, site.url),
}))
