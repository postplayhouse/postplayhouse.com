import site from "../../data/site"
import data from "../../data/_yaml"

export function get(req, res, _next) {
  res.writeHead(200, {
    "Content-Type": "application/json",
  })

  res.end(JSON.stringify({ site, seasons: data.people }))
}
