// This file is read in two separate contexts.
//
// 1. During the Vite build, as a dependency of the
//    `downloadMediaImagesVitePlugin.ts` file.
// 2. During runtime, when the app is running in vite, to get the list of
//    downloaded images and their descriptions.
//
// The vite plugin context does not play well with import aliases and with
// import.meta.glob, so we tuck all of those away inside the `getEnhancedImages`
// function, which is only called at runtime in the app context.
//
// The reason everything is in here is for the colocation of the names of the
// cache dir, json index file, and complimentary glob import.

export const JSON_FILE_NAME = "_downloadedImages.json"
export const CACHE_DIR = "./cache.ignore"

export type MediaImage = {
	relativeFilePath: string
	description: string | undefined
}

export async function getEnhancedImages() {
	const { makeFindImage } = await import("$helpers/enhancedImg")
	const { asserted } = await import("$helpers")

	const findImage = makeFindImage(
		import.meta.glob("./cache.ignore/*", {
			query: { enhanced: true },
			eager: true,
		}),
	)

	// This one file is not an image. It is the JSON index of downloaded images.
	const filesIndex = findImage(JSON_FILE_NAME) as unknown as MediaImage[]

	return Promise.all(
		filesIndex.map((img) => ({
			description: img.description,
			src: asserted(findImage(img.relativeFilePath)),
		})),
	)
}
