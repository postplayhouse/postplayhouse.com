import "./lib/env"
import { load as yamlLoad } from "js-yaml"
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs"
import { resolve } from "path"
import { getCurrentSeason, seasonYamlPath, imagesDir } from "./lib/season"
import {
  readSeasonYaml,
  writeSeasonYaml,
  extractPositionBlock,
  replacePositionBlock,
} from "./lib/yaml"
import {
  git,
  ensureCleanWorkingDir,
  fetchRemoteBioUpdateBranches,
  listBioUpdateBranches,
  checkoutBranch,
  commitFiles,
  commitAll,
  branchHasCommit,
  currentBranch,
  getPositionBlameTimestamp,
} from "./lib/git"
import { hashImage, imagesSimilar, findPreviousImage } from "./lib/image"
import {
  linkInstagramHandles,
  linkBareUrls,
  verifyUrl,
  extractUrls,
} from "./lib/bio-transforms"
import { processBioWithClaude } from "./lib/claude"

interface PersonData {
  first_name: string
  last_name: string
  image_year?: number
  bio?: string
  program_bio?: string
  roles?: Record<string, string[]>
  production_positions?: Record<string, string[]>
  [key: string]: unknown
}

const noSuggestEdits = process.argv.includes("--no-suggest-edits")

async function main() {
  ensureCleanWorkingDir()
  const startBranch = currentBranch()
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)
  console.log(`Current season: ${season}`)

  console.log("Fetching remote bio-update branches...")
  fetchRemoteBioUpdateBranches()

  const branches = listBioUpdateBranches()
  console.log(`Found ${branches.length} bio-update branches`)

  // Filter to branches created since September 1st of the prior year (season starts then)
  const cutoffYear = season - 1
  const cutoff = new Date(cutoffYear, 8, 1) // September 1st of prior year
  const seasonBranches = branches.filter((b) => b.date >= cutoff)
  console.log(
    `${seasonBranches.length} branches in current season (since ${cutoff.toISOString()})`,
  )

  if (seasonBranches.length === 0) {
    console.log("Nothing to process.")
    checkoutBranch(startBranch)
    return
  }

  const verifiedLinks: { name: string; position: number; url: string }[] = []
  const brokenLinks: { name: string; position: number; url: string; status?: number }[] = []

  for (const { branch, position } of seasonBranches) {
    // Skip if master's blame for this position is newer than the branch's
    // latest commit — means the content was already merged (squash merges
    // don't share commit history, so rev-list can't detect this).
    const masterBlame = getPositionBlameTimestamp(yamlPath, position, "master")
    const branchLatest = new Date(parseInt(git(`log -1 --format=%ct ${branch}`).trim()) * 1000)
    if (masterBlame && masterBlame >= branchLatest) {
      console.log(`\n--- Skipping ${branch} (master blame ${masterBlame.toISOString()} >= branch tip ${branchLatest.toISOString()}) ---`)
      continue
    }

    console.log(`\n--- Processing ${branch} (position ${position}) ---`)

    try {
      checkoutBranch(branch)
      await processBranch(position, season, yamlPath, verifiedLinks, brokenLinks)
    } catch (err) {
      console.error(`Error processing ${branch}:`, err)
    }
  }

  checkoutBranch(startBranch)

  console.log(`\n--- Link report ---`)
  if (verifiedLinks.length > 0) {
    for (const { name, position, url } of verifiedLinks) {
      console.log(`  OK  Position ${position} (${name}): ${url}`)
    }
  }
  if (brokenLinks.length > 0) {
    for (const { name, position, url, status } of brokenLinks) {
      const statusStr = status ? ` (status: ${status})` : ""
      console.log(`  BROKEN  Position ${position} (${name}): ${url}${statusStr}`)
    }
  }
  if (verifiedLinks.length === 0 && brokenLinks.length === 0) {
    console.log("  No links found.")
  }

  console.log("\nDone.")
}

async function checkLinks(
  name: string,
  position: number,
  yamlPath: string,
  verifiedLinks: { name: string; position: number; url: string }[],
  brokenLinks: { name: string; position: number; url: string; status?: number }[],
) {
  const content = readSeasonYaml(yamlPath)
  const block = extractPositionBlock(content, position)
  if (!block) return

  const parsed = parsePerson(block)
  if (!parsed) return

  const text = [parsed.bio, parsed.program_bio].filter(Boolean).join("\n")
  const urls = extractUrls(text)
  if (!urls.length) return

  for (const url of urls) {
    const result = await verifyUrl(url)
    if (result.reachable) {
      console.log(`  Link OK: ${url}`)
      verifiedLinks.push({ name, position, url })
    } else {
      console.log(`  Link BROKEN: ${url}${result.status ? ` (${result.status})` : ""}`)
      brokenLinks.push({ name, position, url, status: result.status })
    }
  }
}

async function processBranch(
  position: number,
  season: number,
  yamlPath: string,
  verifiedLinks: { name: string; position: number; url: string }[],
  brokenLinks: { name: string; position: number; url: string; status?: number }[],
) {
  // Read the YAML and extract this person's block
  const yamlContent = readSeasonYaml(yamlPath)
  const block = extractPositionBlock(yamlContent, position)
  if (!block) {
    console.log(`  No position block found for position ${position}, skipping`)
    return
  }

  // Parse person data from the YAML block
  const person = parsePerson(block)
  if (!person) {
    console.log(`  Could not parse person data for position ${position}`)
    return
  }

  const name = `${person.first_name} ${person.last_name}`
  console.log(`  Person: ${name}`)

  // Step 1: Raw submission already present as first commit

  // Step 1.5: Normalize CRLF line endings (GitHub API commits with \r\n)
  normalizeCrlf(yamlPath, position)

  // Step 1.75: Optimize images (resize + compress)
  await optimizeImages(season)

  // Step 2: Photo dedup
  await photoDedup(person, position, season, yamlPath)

  // Step 3: Instagram links
  instagramLinks(person, position, yamlPath)

  // Step 4: URL links + verification
  await urlLinks(person, position, yamlPath)

  // Step 4.5: Check for broken links
  await checkLinks(name, position, yamlPath, verifiedLinks, brokenLinks)

  // Step 4.75: Abbreviate state names in location
  abbreviateState(position, yamlPath)

  // Step 5, 6, 7: Claude pass (italics + capitalization + content flag)
  claudePass(person, position, season, yamlPath, noSuggestEdits)
}

function parsePerson(block: string): PersonData | null {
  try {
    const docs = yamlLoad(block) as PersonData[]
    if (Array.isArray(docs) && docs.length > 0) {
      return docs[0]
    }
    return null
  } catch (err) {
    console.error("  YAML parse error:", err)
    return null
  }
}

function extractShowTitles(yamlContent: string): string[] {
  const titles = new Set<string>()

  // Find lines under roles: and production_positions: sections
  // Show titles are indented 4 spaces and end with a colon
  const lines = yamlContent.split("\n")
  let inSection = false

  for (const line of lines) {
    // Check if we're entering a roles or production_positions section
    if (/^ {2}(roles|production_positions):$/.test(line)) {
      inSection = true
      continue
    }

    // If we're in a section, look for show titles (4 spaces indent, ending with colon)
    if (inSection) {
      const match = line.match(/^ {4}(.+):$/)
      if (match) {
        titles.add(match[1])
      } else if (/^ {2}\S/.test(line) || /^[^ ]/.test(line) || /^# /.test(line)) {
        // We've left the section (less indentation or comment)
        inSection = false
      }
    }
  }

  return Array.from(titles)
}

function normalizeCrlf(yamlPath: string, position: number) {
  if (branchHasCommit("Normalize line endings")) {
    console.log("  CRLF: already done, skipping")
    return
  }

  const raw = readFileSync(yamlPath, "utf-8")
  if (!raw.includes("\r\n")) {
    return
  }

  const normalized = raw.replace(/\r\n/g, "\n")
  writeFileSync(yamlPath, normalized, "utf-8")
  commitFiles([yamlPath], "Normalize line endings")
  console.log("  Normalized CRLF line endings")
}

async function optimizeImages(season: number) {
  if (branchHasCommit("Optimize image")) {
    console.log("  Images: already optimized, skipping")
    return
  }

  const imgDir = imagesDir(season)
  if (!existsSync(imgDir)) return

  // Only optimize images that were added/changed on this branch (not already on master)
  let changedFiles: string[]
  try {
    const diff = git(`diff --name-only master -- src/images/people/${season}/`)
    changedFiles = diff ? diff.split("\n").filter(Boolean) : []
  } catch {
    changedFiles = []
  }

  const imageFiles = changedFiles
    .map((f) => f.split("/").pop()!)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .filter((f) => existsSync(resolve(imgDir, f)))
  if (!imageFiles.length) return

  const sharp = (await import("sharp")).default
  const MAX_DIMENSION = 1200
  let optimized = false

  const yamlPath = seasonYamlPath(season)

  for (const file of imageFiles) {
    const filePath = resolve(imgDir, file)
    const ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase()
    const baseName = file.slice(0, file.lastIndexOf("."))
    const targetFile = `${baseName}.jpg`
    const targetPath = resolve(imgDir, targetFile)
    const renaming = targetFile !== file

    const metadata = await sharp(filePath).metadata()
    const width = metadata.width ?? 0
    const height = metadata.height ?? 0
    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION

    // Auto-orient based on EXIF, then resize to fit within MAX_DIMENSION.
    // Note: sharp converts wide gamut (e.g. Display P3) to sRGB by default.
    // This is intentional — keeps headshots visually consistent. To preserve
    // the original color profile instead, add .keepIccProfile() here.
    // All output is JPEG regardless of source format.
    let pipeline = sharp(filePath).autoOrient()
    if (needsResize) {
      pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
    }
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true })

    const outputBuffer = await pipeline.toBuffer()
    const originalSize = readFileSync(filePath).length
    const newSize = outputBuffer.length

    writeFileSync(targetPath, outputBuffer)

    if (renaming) {
      // Remove old file from disk and git index, then stage new .jpg
      unlinkSync(filePath)
      git(`rm --cached "${filePath}"`)
      // Update any explicit image_file reference in the YAML
      const yamlContent = readFileSync(yamlPath, "utf-8")
      if (yamlContent.includes(file)) {
        writeFileSync(yamlPath, yamlContent.replaceAll(file, targetFile), "utf-8")
      }
      console.log(`  Renamed ${file} → ${targetFile} (${ext !== "jpg" ? "converted to JPEG" : "normalized extension"})`)
    }

    const savings = Math.round((1 - newSize / originalSize) * 100)
    const dims = needsResize ? ` (resized from ${width}x${height})` : ""
    const sizeChange = savings > 0 ? `${savings}% smaller` : `${-savings}% larger`
    console.log(
      `  Optimized ${targetFile}: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${sizeChange})${dims}`,
    )
    optimized = true
  }

  if (optimized) {
    commitAll("Optimize images")
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)}KB`
  return `${(kb / 1024).toFixed(1)}MB`
}

async function photoDedup(
  person: PersonData,
  position: number,
  season: number,
  yamlPath: string,
) {
  if (branchHasCommit("Reuse existing photo")) {
    console.log("  Photo dedup: already done, skipping")
    return
  }

  const imgDir = imagesDir(season)
  const kebabName = `${person.first_name}-${person.last_name}`
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")

  // Find current submitted image
  let currentImagePath: string | null = null
  if (existsSync(imgDir)) {
    const files = readdirSync(imgDir)
    const match = files.find((f) => {
      const nameWithoutExt = f.slice(0, f.lastIndexOf("."))
      return nameWithoutExt === kebabName
    })
    if (match) {
      currentImagePath = resolve(imgDir, match)
    }
  }

  if (!currentImagePath) {
    console.log("  No current image found, skipping photo dedup")
    return
  }

  // Find previous image
  const previous = findPreviousImage(
    person.first_name,
    person.last_name,
    season,
  )
  if (!previous) {
    console.log("  No previous image found, skipping photo dedup")
    return
  }

  console.log(`  Comparing images: current vs ${previous.year}`)

  try {
    const [currentHash, previousHash] = await Promise.all([
      hashImage(currentImagePath),
      hashImage(previous.path),
    ])

    if (imagesSimilar(currentHash, previousHash)) {
      console.log(
        `  Images are similar — reusing photo from ${previous.year}`,
      )

      // Update image_year in YAML
      const content = readSeasonYaml(yamlPath)
      const blockContent = extractPositionBlock(content, position)!
      const updatedBlock = blockContent.replace(
        /image_year:\s*\d+/,
        `image_year: ${previous.year}`,
      )
      const newContent = replacePositionBlock(content, position, updatedBlock)
      writeSeasonYaml(yamlPath, newContent)

      // Delete the duplicate image
      unlinkSync(currentImagePath)

      commitAll(`Reuse existing photo from ${previous.year}`)
    } else {
      console.log("  Images are different, keeping new photo")
    }
  } catch (err) {
    console.error("  Error during photo dedup:", err)
  }
}

function instagramLinks(
  person: PersonData,
  position: number,
  yamlPath: string,
) {
  if (branchHasCommit("Link Instagram")) {
    console.log("  Instagram: already done, skipping")
    return
  }

  const content = readSeasonYaml(yamlPath)
  const block = extractPositionBlock(content, position)
  if (!block) return

  const parsed = parsePerson(block)
  if (!parsed) return

  let changed = false
  let newBio = parsed.bio ?? null
  let newProgramBio = parsed.program_bio ?? null

  if (parsed.bio) {
    const result = linkInstagramHandles(parsed.bio)
    if (result) {
      newBio = result
      changed = true
    }
  }

  if (parsed.program_bio) {
    const result = linkInstagramHandles(parsed.program_bio)
    if (result) {
      newProgramBio = result
      changed = true
    }
  }

  if (changed) {
    updateBioInYaml(yamlPath, position, content, block, newBio, newProgramBio)
    commitFiles([yamlPath], "Link Instagram handle")
    console.log("  Linked Instagram handles")
  }
}

async function urlLinks(
  person: PersonData,
  position: number,
  yamlPath: string,
) {
  if (branchHasCommit("Link website URLs")) {
    console.log("  URLs: already done, skipping")
    return
  }

  const content = readSeasonYaml(yamlPath)
  const block = extractPositionBlock(content, position)
  if (!block) return

  const parsed = parsePerson(block)
  if (!parsed) return

  let changed = false
  let newBio = parsed.bio ?? null
  let newProgramBio = parsed.program_bio ?? null

  if (parsed.bio) {
    const result = linkBareUrls(parsed.bio)
    if (result) {
      newBio = result
      changed = true
    }
  }

  if (parsed.program_bio) {
    const result = linkBareUrls(parsed.program_bio)
    if (result) {
      newProgramBio = result
      changed = true
    }
  }

  if (changed) {
    updateBioInYaml(yamlPath, position, content, block, newBio, newProgramBio)
    commitFiles([yamlPath], "Link website URLs")
    console.log("  Linked website URLs")
  }
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR",
  California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
  "District of Columbia": "DC",
}

function abbreviateState(position: number, yamlPath: string) {
  if (branchHasCommit("Abbreviate state")) {
    console.log("  State: already done, skipping")
    return
  }

  const content = readSeasonYaml(yamlPath)
  const block = extractPositionBlock(content, position)
  if (!block) return

  // Match the location field: `  location: "City, State"`
  const locationMatch = block.match(/  location: "(.+)"/)
  if (!locationMatch) return

  const location = locationMatch[1]

  // Check if state name (after last comma) is a full name
  const lastComma = location.lastIndexOf(",")
  if (lastComma === -1) return

  const statePart = location.slice(lastComma + 1).trim()

  const abbrev = STATE_ABBREVIATIONS[statePart]
  if (!abbrev) return // already abbreviated or not a US state

  const newLocation = `${location.slice(0, lastComma)}, ${abbrev}`
  const updatedBlock = block.replace(
    `location: "${location}"`,
    `location: "${newLocation}"`,
  )

  if (updatedBlock === block) return

  const newContent = replacePositionBlock(content, position, updatedBlock)
  writeSeasonYaml(yamlPath, newContent)
  commitFiles([yamlPath], "Abbreviate state in location")
  console.log(`  Abbreviated state: ${statePart} → ${abbrev}`)
}

function claudePass(
  person: PersonData,
  position: number,
  season: number,
  yamlPath: string,
  skipSuggestEdits = false,
) {
  if (branchHasCommit("Claude pass")) {
    console.log("  Claude: already done, skipping")
    return
  }

  const content = readSeasonYaml(yamlPath)
  const block = extractPositionBlock(content, position)
  if (!block) return

  const parsed = parsePerson(block)
  if (!parsed) return

  if (!parsed.bio) {
    console.log("  No bio text, skipping Claude pass")
    return
  }

  // Extract show titles from the full YAML
  const showTitles = extractShowTitles(content)
  console.log(`  Show titles for Claude: ${showTitles.join(", ") || "(none)"}`)

  console.log("  Running Claude pass...")
  const result = processBioWithClaude(
    parsed.bio,
    parsed.program_bio ?? null,
    showTitles,
  )

  let madeCommit = false

  // Step 5: Italics fixes
  if (result.italicsBio || result.italicsProgramBio) {
    const currentContent = readSeasonYaml(yamlPath)
    const currentBlock = extractPositionBlock(currentContent, position)!
    const currentParsed = parsePerson(currentBlock)!

    updateBioInYaml(
      yamlPath,
      position,
      currentContent,
      currentBlock,
      result.italicsBio ?? currentParsed.bio ?? null,
      result.italicsProgramBio ?? currentParsed.program_bio ?? null,
    )
    const committed = commitFiles([yamlPath], "Claude pass: Fix show title italics")
    if (committed) {
      console.log("  Fixed show title italics")
      madeCommit = true
    }
  }

  // Step 6: Capitalization fixes
  if (result.capsBio || result.capsProgramBio) {
    const capsContent = readSeasonYaml(yamlPath)
    const capsBlock = extractPositionBlock(capsContent, position)!
    const capsParsed = parsePerson(capsBlock)!

    updateBioInYaml(
      yamlPath,
      position,
      capsContent,
      capsBlock,
      result.capsBio ?? capsParsed.bio ?? null,
      result.capsProgramBio ?? capsParsed.program_bio ?? null,
    )
    const committed = commitFiles([yamlPath], "Claude pass: Fix capitalization")
    if (committed) {
      console.log("  Fixed capitalization")
      madeCommit = true
    }
  }

  // Step 7: Content flag
  if (result.contentFlag.flagged && !skipSuggestEdits) {
    const flagContent = readSeasonYaml(yamlPath)
    const flagBlock = extractPositionBlock(flagContent, position)!
    const flagParsed = parsePerson(flagBlock)!

    const cleanedBio =
      result.contentFlag.cleanedBio ?? flagParsed.bio ?? null
    const cleanedProgramBio =
      result.contentFlag.cleanedProgramBio ?? flagParsed.program_bio ?? null

    updateBioInYaml(
      yamlPath,
      position,
      flagContent,
      flagBlock,
      cleanedBio,
      cleanedProgramBio,
    )
    const committed = commitFiles(
      [yamlPath],
      "Claude pass: PROPOSED EDIT",
      result.contentFlag.reasoning,
    )
    if (committed) {
      console.log(
        `  Content flagged: ${result.contentFlag.reasoning}`,
      )
      madeCommit = true
    }
  }

  if (!madeCommit) {
    git(`commit --allow-empty -m "Claude pass: no changes needed"`)
    console.log("  Claude pass: no changes needed")
  }
}

/**
 * Replace bio and/or program_bio text within a YAML position block.
 * Handles the 4-space indentation used for block scalars.
 */
function updateBioInYaml(
  yamlPath: string,
  position: number,
  fullContent: string,
  currentBlock: string,
  newBio: string | null,
  newProgramBio: string | null,
) {
  let updatedBlock = currentBlock

  if (newBio !== null) {
    updatedBlock = replaceBioField(updatedBlock, "bio", newBio)
  }

  if (newProgramBio !== null) {
    updatedBlock = replaceBioField(updatedBlock, "program_bio", newProgramBio)
  }

  if (updatedBlock !== currentBlock) {
    const newContent = replacePositionBlock(fullContent, position, updatedBlock)
    writeSeasonYaml(yamlPath, newContent)
  }
}

/**
 * Replace a multi-line bio field (bio or program_bio) in a YAML block.
 * The field uses | block scalar with 4-space indentation.
 */
function replaceBioField(
  block: string,
  fieldName: string,
  newText: string,
): string {
  // Match the field header and its indented content up to the next field or end of block.
  // Content lines start with 4 spaces (may be content, or whitespace-only).
  // The last line may not end with \n (extractPositionBlock trims trailing whitespace).
  const fieldPattern = new RegExp(
    `(  ${fieldName}: \\|\\n)((?:    .*(?:\\n|$)|\\n)*)`,
  )
  const match = block.match(fieldPattern)
  if (!match) {
    return block
  }

  // Format new text with 4-space indentation
  const indentedText = newText
    .replace(/\n$/, "") // Remove trailing newline if present
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : `    ${line}`))
    .join("\n")

  return block.replace(match[0], `${match[1]}${indentedText}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
