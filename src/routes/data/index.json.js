import data from "../../data/"

export function get(_req, res, _next) {
  res.writeHead(200, {
    "Content-Type": "application/json",
  })

  res.end(JSON.stringify(data))
}
