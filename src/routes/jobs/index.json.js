import { postsMetadata } from "../../helpers/blog-dir-metadata"

const contents = JSON.stringify(postsMetadata("src/routes/jobs/").reverse())

export function get(req, res) {
  res.writeHead(200, {
    "Content-Type": "application/json",
  })
  res.end(contents)
}
