export function preload(_routeInfo) {
  return this.fetch(`data.json`)
    .then((r) => r.json())
    .then((data) => {
      return { site: data.site }
    })
}
