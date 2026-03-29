import { existsSync } from "fs"
import { resolve } from "path"
import { dirname } from "path"
import { fileURLToPath } from "url"
import imghash from "imghash"

const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))

export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heif", ".heic"]

export function fileHasImgExt(filename: string): boolean {
  return IMAGE_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext))
}

const SIMILARITY_THRESHOLD = 10 // Hamming distance — lower = more similar. 10 is very loose.

/** Compute perceptual hash of an image file */
export async function hashImage(imagePath: string): Promise<string> {
	return imghash.hash(imagePath, 16) // 16-bit hash for decent granularity
}

/** Compare two image hashes. Returns true if they are similar enough. */
export function imagesSimilar(hash1: string, hash2: string): boolean {
	const distance = hammingDistance(hash1, hash2)
	return distance <= SIMILARITY_THRESHOLD
}

function hammingDistance(a: string, b: string): number {
	if (a.length !== b.length) return Infinity

	const binA = BigInt("0x" + a)
	const binB = BigInt("0x" + b)
	const xor = binA ^ binB

	let count = 0
	let val = xor
	while (val > 0n) {
		count += Number(val & 1n)
		val >>= 1n
	}
	return count
}

/**
 * Find a previous image for a person by name across prior season directories.
 * Returns the path and year if found, null otherwise.
 */
export function findPreviousImage(
	firstName: string,
	lastName: string,
	currentSeason: number,
): { path: string; year: number } | null {
	const imagesBase = resolve(__dirname, "../../../src/images/people")
	const kebabName = `${firstName}-${lastName}`
		.toLowerCase()
		.replace(/[^a-z]+/g, "-")

	for (let year = currentSeason - 1; year >= 2015; year--) {
		const yearDir = resolve(imagesBase, String(year))
		const extensions = IMAGE_EXTENSIONS

		for (const ext of extensions) {
			const candidate = resolve(yearDir, `${kebabName}${ext}`)
			if (existsSync(candidate)) {
				return { path: candidate, year }
			}
		}
	}

	return null
}
