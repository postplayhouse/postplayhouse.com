import { getEnhancedImages } from "./lib"

export async function load() {
	return {
		images: await getEnhancedImages(),
	}
}
