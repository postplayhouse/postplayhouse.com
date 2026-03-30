import "./lib/env"
import { listFiles, downloadFileById, parseSubmissionFilename, findMatchingImage } from "./lib/b2"
import { fileHasImgExt } from "./lib/image"
import { getCurrentSeason } from "./lib/season"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
const cacheDir = resolve(__dirname, "b2-cache.ignore")

interface Submission {
  position: number
  name: string
  b2Timestamp: string
  fileName: string
  imageFile: string | null
  imageTimestamp: string | null
}

interface UnmatchedImage {
  fileName: string
  uploadTimestamp: string
  parsedName: string | null
}

async function main() {
  const refresh = process.argv.includes("--refresh")
  const season = getCurrentSeason()

  mkdirSync(cacheDir, { recursive: true })

  const allFiles = await listFiles()

  // Season cutoff: September 1st of the year before the season
  const cutoffYear = season - 1
  const cutoff = new Date(cutoffYear, 8, 1)

  const seasonFiles = allFiles.filter(
    (f) => new Date(f.uploadTimestamp) >= cutoff,
  )
  const txtFiles = seasonFiles.filter((f) => f.fileName.endsWith(".txt"))
  const imgFiles = seasonFiles.filter((f) => fileHasImgExt(f.fileName))

  // Download and cache .txt files
  for (const file of txtFiles) {
    const cachePath = resolve(cacheDir, file.fileName)
    if (!refresh && existsSync(cachePath)) continue
    const data = await downloadFileById(file.fileId)
    writeFileSync(cachePath, data)
  }

  // Parse submissions from cached files
  const submissions: Submission[] = []
  const matchedImageFileNames = new Set<string>()

  for (const file of txtFiles) {
    const cachePath = resolve(cacheDir, file.fileName)
    const content = readFileSync(cachePath, "utf-8")

    const parts = content.split(/\n{3,}/)
    const metadataSection = parts.slice(1).join("\n")
    const positionMatch = metadataSection.match(/bio position:\s*(\d+)/)
    if (!positionMatch) continue

    const position = parseInt(positionMatch[1])
    const parsed = parseSubmissionFilename(file.fileName)
    const name = parsed
      ? `${capitalize(parsed.firstName)} ${capitalize(parsed.lastName)}`
      : `Position ${position}`

    // Find matching image
    const basename = file.fileName.replace(/\.txt$/, "")
    const imageFile = findMatchingImage(allFiles, basename)
    if (imageFile) matchedImageFileNames.add(imageFile.fileName)

    submissions.push({
      position,
      name,
      b2Timestamp: new Date(file.uploadTimestamp).toISOString(),
      fileName: file.fileName,
      imageFile: imageFile?.fileName ?? null,
      imageTimestamp: imageFile
        ? new Date(imageFile.uploadTimestamp).toISOString()
        : null,
    })
  }

  // Find unmatched images
  const unmatchedImages: UnmatchedImage[] = imgFiles
    .filter((f) => !matchedImageFileNames.has(f.fileName))
    .map((f) => {
      // Try to parse name from image filename (same format: {timestamp}-{first}-{last}.ext)
      const nameWithoutExt = f.fileName.slice(0, f.fileName.lastIndexOf("."))
      const parsed = parseSubmissionFilename(nameWithoutExt + ".txt") // reuse parser
      return {
        fileName: f.fileName,
        uploadTimestamp: new Date(f.uploadTimestamp).toISOString(),
        parsedName: parsed
          ? `${capitalize(parsed.firstName)} ${capitalize(parsed.lastName)}`
          : null,
      }
    })

  console.log(JSON.stringify({ submissions, unmatchedImages }, null, 2))
}

function capitalize(s: string): string {
  return s
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
