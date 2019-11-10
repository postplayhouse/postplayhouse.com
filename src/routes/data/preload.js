export function preload(_routeInfo) {
  return this.fetch(`data.json`)
    .then((r) => r.json())
    .then((data) => {
      console.log("DATATATATAATA", data)
      return { site: data }
    })
}
