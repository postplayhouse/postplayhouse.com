import { historicalImages } from "$lib/server/historical-images"
import { newsImageReferences } from "$lib/server/generated/news-image-references"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = ({ route }) => {
	const reference = (
		newsImageReferences as Record<
			string,
			{ people: readonly string[]; seasons: readonly string[] }
		>
	)[route.id]
	return {
		historicalImages: historicalImages({
			people: reference?.people,
			seasons: reference?.seasons,
			raffle:
				route.id === "/(app)/news/2024-02-06-annual-raffle"
					? ["2018/ken-phillips.jpg", "2016/dewayne-barrett.jpg"]
					: [],
		}),
	}
}
