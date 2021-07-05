export function load(obj) {
  return obj
    .fetch(`data.json`)
    .then((r) => r.json())
    .then((data) => {
      return { site: data }
    })
}
