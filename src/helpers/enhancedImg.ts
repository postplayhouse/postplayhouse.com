/**
 * Grabbed this from imagetools-core/dist/types.d.ts
 */
export interface Picture {
	/**
	 * Key is format. Value is srcset.
	 */
	sources: Record<string, string>
	img: {
		src: string
		w: number
		h: number
	}
}

const peopleImageModules = import.meta.glob<{ default: Picture }>(
	`/src/images/people/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
	{
		eager: true,
		query: {
			enhanced: true,
			w: "400;800",
			withoutEnlargement: true,
		},
	},
)

const peopleDict = Object.entries(peopleImageModules)

export function findEnhancedPersonImage(partialImagePath: string | undefined) {
	if (!partialImagePath) return

	const possibleModule = peopleDict.find(([path]) =>
		path.includes(partialImagePath),
	)?.[1]

	return possibleModule?.default
}

const seasonImageModules = import.meta.glob<{ default: Picture }>(
	`/src/images/seasons/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
	{
		eager: true,
		query: {
			enhanced: true,
			w: "500;1000;1500",
			withoutEnlargement: true,
		},
	},
)

const seasonDict = Object.entries(seasonImageModules)

export function findEnhancedSeasonImage(partialImagePath: string | undefined) {
	if (!partialImagePath) return

	const possibleModule = seasonDict.find(([path]) =>
		path.includes(partialImagePath),
	)?.[1]

	return possibleModule?.default
}
