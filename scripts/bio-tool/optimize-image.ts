import { readFileSync, writeFileSync, unlinkSync } from "fs"
import { resolve, extname, basename, dirname, join } from "path"

const MAX_DIMENSION = 1200
const JPEG_QUALITY = 82

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error("Usage: pnpm bio:optimize <image-file>")
    process.exit(1)
  }

  const filePath = resolve(input)
  const ext = extname(filePath).toLowerCase()
  const base = basename(filePath, extname(filePath))
  const dir = dirname(filePath)
  const targetPath = join(dir, `${base}.jpg`)
  const renaming = targetPath !== filePath

  const originalSize = readFileSync(filePath).length

  const sharp = (await import("sharp")).default
  const metadata = await sharp(filePath).metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION

  let pipeline = sharp(filePath).autoOrient()
  if (needsResize) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
  }
  pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })

  const outputBuffer = await pipeline.toBuffer()
  writeFileSync(targetPath, outputBuffer)

  if (renaming) {
    unlinkSync(filePath)
    console.log(`Converted ${basename(filePath)} → ${basename(targetPath)}`)
  }

  const newSize = outputBuffer.length
  const savings = Math.round((1 - newSize / originalSize) * 100)
  const dims = needsResize ? ` (resized from ${width}x${height})` : ""
  const sizeChange = savings > 0 ? `${savings}% smaller` : `${-savings}% larger`
  console.log(
    `${basename(targetPath)}: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${sizeChange})${dims}`,
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)}KB`
  return `${(kb / 1024).toFixed(1)}MB`
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
