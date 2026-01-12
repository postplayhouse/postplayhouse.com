import sharp from "sharp"

/**
 * Process a headshot image for web display
 * - Resize to max 800x800 (fit inside, no enlargement)
 * - Convert to progressive JPEG with quality 80
 */
export async function processHeadshotImage(imageBuffer: Buffer): Promise<Buffer> {
	return sharp(imageBuffer)
		.resize(800, 800, {
			fit: "inside",
			withoutEnlargement: true,
		})
		.jpeg({
			quality: 80,
			progressive: true,
		})
		.toBuffer()
}

/**
 * Helper to convert a name to kebab-case for filenames
 */
export function toKebabCase(str: string): string {
	return str
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/gi, "-")
		.replace(/^-+|-+$/g, "")
}

/**
 * Generate the optimized image filename for B2 storage
 */
export function getOptimizedImagePath(
	season: number,
	firstName: string,
	lastName: string,
): string {
	const kebabName = toKebabCase(`${firstName} ${lastName}`)
	return `optimized/${season}/${kebabName}.jpg`
}
