import { season } from "$data/site"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ setHeaders }) => {
	// Program bios always shows current season, so always set SSR cache headers
	setHeaders({
		"Cache-Control": "public, max-age=0",
		"Netlify-CDN-Cache-Control":
			"public, max-age=86400, stale-while-revalidate=3600",
		"Cache-Tag": `people-${season},bios`,
	})
}
