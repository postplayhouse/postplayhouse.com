import type { Picture } from "$helpers/enhancedImg"
import type { HistoricalImagePageData } from "$lib/historical-images"
import {
	historicalPeoplePictures,
	historicalRafflePictures,
	historicalSeasonPictures,
} from "$lib/server/generated/historical-images"

type PictureMap = Record<string, Picture>

const people: PictureMap = historicalPeoplePictures
const seasons: PictureMap = historicalSeasonPictures
const raffle: PictureMap = historicalRafflePictures

function select(source: PictureMap, keys: Iterable<string>): PictureMap {
	return Object.fromEntries(
		[...new Set(keys)]
			.sort()
			.flatMap((key) => (source[key] ? [[key, source[key]]] : [])),
	)
}

export function historicalImages({
	people: peopleKeys = [],
	seasons: seasonKeys = [],
	raffle: raffleKeys = [],
}: {
	people?: Iterable<string>
	seasons?: Iterable<string>
	raffle?: Iterable<string>
}): HistoricalImagePageData {
	return {
		people: select(people, peopleKeys),
		seasons: select(seasons, seasonKeys),
		raffle: select(raffle, raffleKeys),
	}
}

export function historicalPersonPicture(id: string): Picture | undefined {
	return people[id]
}

export function hasHistoricalPerson(id: string): boolean {
	return Object.hasOwn(people, id)
}
