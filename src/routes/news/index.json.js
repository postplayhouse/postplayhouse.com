import postsData from "./_posts-metadata"

const contents = JSON.stringify(
  postsData.reverse().map(({ title, slug, date }) => ({ title, slug, date })),
)

export function get(req, res) {
  res.writeHead(200, {
    "Content-Type": "application/json",
  })

  res.end(contents)
}
