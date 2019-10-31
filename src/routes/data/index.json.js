import data from "../../data/"

export function get(_req, res, _next) {
  console.log("request", data)
  res.writeHead(200, {
    "Content-Type": "application/json",
  })

  res.end(JSON.stringify(data))
}
