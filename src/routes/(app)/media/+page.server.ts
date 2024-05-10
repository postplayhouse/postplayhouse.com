import * as fs from "node:fs"

export async function load() {
	const images = fs.readdirSync("static/images/gallery").filter((file) => {
		// if is image file
		if (
			file.endsWith(".jpg") ||
			file.endsWith(".png") ||
			file.endsWith(".jpeg") ||
			file.endsWith(".webp")
		) {
			// return file name
			return file
		}
	})

	return { imagePaths: images }
}
