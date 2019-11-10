import site from "../../data/site"
import data from "../../data/_yaml"

export function get(_req, res, _next) {
  res.writeHead(200, {
    "Content-Type": "application/json",
  })

  res.end(JSON.stringify({ ...site, data }))
}
