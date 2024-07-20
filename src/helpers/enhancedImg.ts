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

function makeFindImage<T = Picture>(
	importedImageModules: Record<string, { default: T }>,
) {
	return function findImage(partialImagePath: string | undefined) {
		if (!partialImagePath) return

		const possibleModule = Object.entries(importedImageModules).find(([path]) =>
			path.includes(partialImagePath),
		)?.[1]

		return possibleModule?.default
	}
}

export const findEnhancedPersonImage = makeFindImage(
	import.meta.glob(
		`/src/images/people/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
		{
			eager: true,
			query: {
				enhanced: true,
				w: "400;800",
				withoutEnlargement: true,
			},
		},
	),
)

export const findOriginalPersonImage = makeFindImage<string>(
	import.meta.glob(
		`/src/images/people/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
		{
			eager: true,
		},
	),
)

export const findEnhancedSeasonImage = makeFindImage(
	import.meta.glob(
		`/src/images/seasons/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}`,
		{
			eager: true,
			query: {
				enhanced: true,
				w: "500;1000;1500",
				withoutEnlargement: true,
			},
		},
	),
)
