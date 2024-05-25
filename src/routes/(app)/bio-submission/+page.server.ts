import fs from "node:fs"
import path from "node:path"

export const prerender = true

function getImagesFromDirectory(directoryPath: string): string[] {
	let imageFiles: string[] = []

	const files = fs.readdirSync(directoryPath)
	files.forEach((file) => {
		const filePath = path.join(directoryPath, file)
		const stats = fs.statSync(filePath)
		if (stats.isDirectory()) {
			imageFiles = imageFiles.concat(getImagesFromDirectory(filePath))
		} else {
			const extension = path.extname(file).toLowerCase()
			if (
				extension === ".jpg" ||
				extension === ".jpeg" ||
				extension === ".png"
			) {
				imageFiles.push(filePath)
			}
		}
	})

	return imageFiles
}

export async function load() {
	return {
		imageFiles: getImagesFromDirectory("src/images/people"),
	}
}
