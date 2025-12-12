import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"
import jsdom from "jsdom"
import { CACHE_DIR, JSON_FILE_NAME, type MediaImage } from "./lib"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export default {
	name: "download-basecamp-images",
	async buildStart() {
		const pageUrl = "https://public.3.basecamp.com/p/6Ks7BYKuf2KhwH4kETrPsJRR"

		async function fetchPage(url: string) {
			const response = await fetch(url)
			return await response.text()
		}

		const endsWithFileExtension = /\.\w{3,4}$/

		function getDescription(fig: HTMLElement) {
			let description = fig.querySelector(
				"figcaption > .attachment__name",
			)?.textContent

			if (typeof description !== "string") {
				return ""
			}

			description = description.trim()

			if (endsWithFileExtension.test(description)) return ""

			return description
		}

		function getImgDetailsFromBasecampFigure(fig: HTMLElement) {
			const src = fig.querySelector("img")?.src
			if (typeof src !== "string") {
				return null
			}

			return {
				src,
				description: getDescription(fig),
			}
		}

		function exists<T>(value: T | null | undefined): value is T {
			return value !== null && value !== undefined
		}

		/**
		 * Get unique filename based on URLs shaped like this:
		 * https://public.3.basecamp.com/p/6Ks7BYKuf2KhwH4kETrPsJRR/blobs/BAh7BkkiC19yYWlscwY6BkVUewdJIglkYXRhBjsAVEkiKGdpZDovL2JjMy9CbG9iLzYxNjQ1NDIyMz9leHBpcmVzX2luBjsAVEkiCHB1cgY7AFRJIgtwdWJsaWMGOwBU--4c3e44ee94236d0fb549eb587b87e24e9b72f2b4/preview
		 */
		function getFilenameFromUrl(url: string, format: string) {
			const urlObj = new URL(url)
			const fileName = urlObj.pathname.split("/").at(-2)
			if (!fileName)
				throw new Error("Could not extract filename from URL for " + url)
			return fileName + "." + format
		}

		async function downloadAndCacheImage(url: string, relativeDirPath: string) {
			const response = await fetch(url)
			const blob = await response.arrayBuffer()
			const img = sharp(blob)

			const { format } = await img.metadata()

			fs.mkdirSync(path.join(__dirname, relativeDirPath), {
				recursive: true,
			})

			const imgFileName = path.basename(getFilenameFromUrl(url, format))

			const relativeFilePath = path.join(relativeDirPath, imgFileName)

			fs.writeFileSync(
				path.join(__dirname, relativeFilePath),
				Buffer.from(blob),
			)

			return relativeFilePath
		}

		async function run() {
			const doc = await fetchPage(pageUrl)
			const dom = new jsdom.JSDOM(doc)
			const figures = Array.from(
				dom.window.document.querySelectorAll<HTMLElement>("bc-attachment"),
			)
			const imageDetails: MediaImage[] = await Promise.all(
				figures
					.map(getImgDetailsFromBasecampFigure)
					.filter(exists)
					.map(async (imgDetails) => {
						const relativeFilePath = await downloadAndCacheImage(
							imgDetails.src,
							CACHE_DIR,
						)

						return {
							...imgDetails,
							relativeFilePath,
						}
					}),
			)

			fs.writeFileSync(
				path.join(__dirname, CACHE_DIR, JSON_FILE_NAME),
				JSON.stringify(imageDetails, null, 2),
			)
		}

		await run()
	},
	closeBundle() {
		// Delete the cache.ignore folder after the build is done
		const cacheDir = path.join(__dirname, CACHE_DIR)

		if (fs.existsSync(cacheDir)) {
			fs.rmSync(cacheDir, { recursive: true, force: true })
		}
	},
}
