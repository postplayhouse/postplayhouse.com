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

/**
 * Unlike the `makeFindImage` function above, this one is specifically designed
 * to return a list of images whose paths match the given partial path. From
 * there, you can render them all, and show/hide as needed. This works for
 * images that are dynamically changed out and cannot rely on a new deployment
 * to be correct.
 *
 * You should only pass in an image path which resolves to only a few images.
 */
export function makeFindImages(
	importedImageModules: Record<string, { default: Picture }>,
) {
	return function findImages() {
		return Object.entries(importedImageModules).map(([path, module]) => ({
			path,
			image: module.default,
		}))
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
