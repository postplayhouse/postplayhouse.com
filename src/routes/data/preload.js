export function preload({ _params, _query }) {
  return this.fetch(`data.json`)
    .then((r) => r.json())
    .then((data) => {
      return { site: data.site }
    })
}
