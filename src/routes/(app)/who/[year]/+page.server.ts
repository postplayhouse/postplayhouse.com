import { season } from "$data/site"

export async function load({ params, setHeaders }) {
	const yearNum = parseInt(params.year, 10)

	// Set cache headers for current season pages (SSR)
	// Historical years are prerendered and don't need these headers
	if (yearNum === season) {
		setHeaders({
			"Cache-Control": "public, max-age=0",
			"Netlify-CDN-Cache-Control":
				"public, max-age=86400, stale-while-revalidate=3600",
			"Cache-Tag": `people-${params.year},bios`,
		})
	}
}
