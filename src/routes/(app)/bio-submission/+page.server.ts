import fs from "node:fs"
import path from "node:path"

const disabled = false

export const prerender = true

// When disabled, prevent hydration
export const csr = !disabled

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
		disabled,
		imageFiles: getImagesFromDirectory("src/images/people"),
	}
}
