import type { Picture } from "$helpers/enhancedImg"

export type HistoricalImagePageData = {
	people: Record<string, Picture>
	seasons: Record<string, Picture>
	raffle: Record<string, Picture>
}

export function personImageKey(path: string | undefined): string | undefined {
	return path?.replace(/^\/?(?:src\/)?images\/people\//, "")
}

export function seasonImageKey(
	season: number | string | undefined,
	imageFile: string | undefined,
): string | undefined {
	if (!season || !imageFile) return
	return `${season}/${imageFile}`
}
