import "./lib/env"
import { listFiles, downloadFileById, parseSubmissionFilename, findMatchingImage } from "./lib/b2"
import { getCurrentSeason, seasonYamlPath, imagesDir } from "./lib/season"
import { readSeasonYaml, replacePositionBlock } from "./lib/yaml"
import {
  git,
  ensureCleanWorkingDir,
  getPositionBlameTimestamp,
  createBranch,
  checkoutBranch,
  checkoutMaster,
  commitAll,
  listBioUpdateBranches,
  currentBranch,
} from "./lib/git"
import { writeFileSync, mkdirSync } from "fs"
import { resolve } from "path"
import { saveEmail } from "./lib/manifest"

async function main() {
  ensureCleanWorkingDir()
  const startBranch = currentBranch()
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)
  console.log(`Current season: ${season}`)

  const allFiles = await listFiles()
  console.log(`Found ${allFiles.length} files in B2 bucket`)

  // Only consider files uploaded since the most recent August 1st
  const now = new Date()
  const cutoffYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const cutoff = new Date(cutoffYear, 8, 1) // September 1st
  const bioFiles = allFiles.filter(
    (f) => f.fileName.endsWith(".txt") && new Date(f.uploadTimestamp) >= cutoff,
  )
  console.log(`Found ${bioFiles.length} bio submission files (since ${cutoff.toISOString()})`)

  // Clean up stale branches from prior seasons; track current-season ones
  const allBioUpdateBranches = listBioUpdateBranches()
  const staleBranches = allBioUpdateBranches.filter((b) => b.date < cutoff)
  for (const b of staleBranches) {
    git(`branch -D ${b.branch}`)
    console.log(`  Deleted stale branch: ${b.branch}`)
  }
  const existingBranches = new Set(
    allBioUpdateBranches
      .filter((b) => b.date >= cutoff)
      .map((b) => b.position),
  )

  let processed = 0
  let skipped = 0

  for (const file of bioFiles) {
    const parsed = parseSubmissionFilename(file.fileName)
    if (!parsed) {
      console.log(`  Skipping unparseable filename: ${file.fileName}`)
      continue
    }

    // Use B2's upload timestamp (milliseconds)
    const b2Date = new Date(file.uploadTimestamp)

    // Download and parse the bio content
    const content = (await downloadWithRetry(file.fileId)).toString("utf-8")

    // The file contains YAML bio content followed by metadata after blank lines
    // Format: YAML\n\n\nmetadata
    const parts = content.split(/\n{3,}/)
    const bioYaml = parts[0]

    // Extract position from the metadata section
    const metadataSection = parts.slice(1).join("\n")
    const positionMatch = metadataSection.match(/bio position:\s*(\d+)/)
    if (!positionMatch) {
      console.log(`  Skipping ${file.fileName}: no position found in metadata`)
      continue
    }
    const position = parseInt(positionMatch[1])

    // Extract and save email from metadata
    const emailMatch = metadataSection.match(/[\w.+-]+@[\w.-]+\.\w+/)
    if (emailMatch) {
      const name = `${capitalize(parsed.firstName)} ${capitalize(parsed.lastName)}`
      saveEmail(position, name, emailMatch[0])
    }

    // Check git blame timestamp for this position (newest edit within the block)
    const blameDate = getPositionBlameTimestamp(yamlPath, position)

    if (blameDate && blameDate > b2Date) {
      console.log(
        `  Skipping position ${position} (${parsed.firstName} ${parsed.lastName}): ` +
          `YAML was updated ${blameDate.toISOString()} after B2 submission ${b2Date.toISOString()}`,
      )
      skipped++
      continue
    }

    // Skip if branch already exists
    if (existingBranches.has(position)) {
      console.log(
        `  Skipping position ${position} (${parsed.firstName} ${parsed.lastName}): branch already exists`,
      )
      skipped++
      continue
    }

    console.log(`  Processing position ${position}: ${parsed.firstName} ${parsed.lastName}`)

    // Read current YAML from master
    checkoutMaster()
    const currentYaml = readSeasonYaml(yamlPath)

    // Create branch and apply changes
    const branchName = `bio-update/position-${position}`
    createBranch(branchName)
    checkoutBranch(branchName)

    // Replace the position block
    const newYaml = replacePositionBlock(currentYaml, position, bioYaml)
    writeFileSync(yamlPath, newYaml, "utf-8")

    // Check for matching image file
    const basename = file.fileName.replace(/\.txt$/, "")
    const imageFile = findMatchingImage(allFiles, basename)

    if (imageFile) {
      const ext = imageFile.fileName.slice(imageFile.fileName.lastIndexOf("."))
      const imageName = `${parsed.firstName}-${parsed.lastName}${ext}`
      const imgDir = imagesDir(season)
      mkdirSync(imgDir, { recursive: true })
      const imageData = await downloadWithRetry(imageFile.fileId)
      writeFileSync(resolve(imgDir, imageName), imageData)
      console.log(`    Downloaded image: ${imageName}`)
    }

    // Commit
    const name = `${capitalize(parsed.firstName)} ${capitalize(parsed.lastName)}`
    commitAll(`Bio submission from ${name}`)
    console.log(`    Created branch: ${branchName}`)
    processed++
  }

  checkoutBranch(startBranch)
  console.log(`\nDone. Processed: ${processed}, Skipped: ${skipped}`)
}

async function downloadWithRetry(fileId: string, retries = 3): Promise<Buffer> {
  for (let i = 0; i < retries; i++) {
    try {
      return await downloadFileById(fileId)
    } catch (err) {
      if (i === retries - 1) throw err
      console.log(`    Download failed, retrying (${i + 1}/${retries})...`)
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error("unreachable")
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
