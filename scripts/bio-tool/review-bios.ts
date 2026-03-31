import { execSync } from "child_process"
import { writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import {
  git,
  ensureCleanWorkingDir,
  isPositionAlreadyMerged,
  fetchRemoteBioUpdateBranches,
  listBioUpdateBranches,
  checkoutBranch,
  commitAll,
  currentBranch,
  commitWithMessageFile,
} from "./lib/git"
import { getCurrentSeason, seasonYamlPath } from "./lib/season"
import { extractPositionBlock, replacePositionBlock } from "./lib/yaml"

const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../..")

/** Extract a binary file from a git commit and write it to disk */
function extractFileFromCommit(commit: string, filePath: string, destPath: string): void {
  const dir = dirname(destPath)
  mkdirSync(dir, { recursive: true })
  // Use execSync directly to get raw binary buffer (not string)
  const buffer = execSync(`git show "${commit}:${filePath}"`, {
    cwd: repoRoot,
    maxBuffer: 50 * 1024 * 1024,
  })
  writeFileSync(destPath, buffer)
}

function getCommitsAheadOfMaster(
  branch: string,
): { hash: string; message: string }[] {
  try {
    const log = git(`log master..${branch} --format="%H||%s" --reverse`)
    if (!log) return []
    return log.split("\n").map((line) => {
      const [hash, ...rest] = line.split("||")
      return { hash, message: rest.join("||") }
    })
  } catch {
    return []
  }
}

/** Get the YAML content from a specific commit without checking it out */
function getYamlAtCommit(commit: string, season: number): string {
  return git(`show ${commit}:src/data/people/${season}.yml`).replace(
    /\r\n/g,
    "\n",
  )
}

/** Copy changed images from a commit to the working tree */
function copyImagesFromCommit(commit: string, season: number): void {
  let files: string[]
  try {
    const diff = git(
      `diff --name-only master ${commit} -- src/images/people/${season}/`,
    )
    files = diff ? diff.split("\n").filter(Boolean) : []
  } catch {
    return
  }

  for (const filePath of files) {
    try {
      const absPath = resolve(repoRoot, filePath)
      extractFileFromCommit(commit, filePath, absPath)
    } catch {
      // file may have been deleted on this commit, skip
    }
  }
}

interface BranchInfo {
  branch: string
  position: number
  commits: { hash: string; message: string }[]
}

async function main() {
  ensureCleanWorkingDir()
  const startBranch = currentBranch()
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)

  console.log("Fetching remote bio-update branches...")
  fetchRemoteBioUpdateBranches(yamlPath)

  const cutoffYear = season - 1
  const cutoff = new Date(cutoffYear, 8, 1) // September 1st of prior year
  const branches = listBioUpdateBranches().filter((b) => b.date >= cutoff)

  if (!branches.length) {
    console.log("No current-season bio-update branches found.")
    return
  }

  // Gather commit info per branch, skipping already-merged positions
  const branchInfos: BranchInfo[] = []
  for (const { branch, position } of branches) {
    if (isPositionAlreadyMerged(yamlPath, position, branch)) {
      continue
    }
    const commits = getCommitsAheadOfMaster(branch)
    if (!commits.length) continue
    branchInfos.push({ branch, position, commits })
  }

  console.log(`Found ${branchInfos.length} branches to review`)

  // Get master YAML as base
  const masterYaml = git(`show master:src/data/people/${season}.yml`).replace(
    /\r\n/g,
    "\n",
  )

  // --- Build commit 1: Raw submissions ---
  // For each branch, take the position block from the first commit
  let rawYaml = masterYaml
  const rawImages: { path: string; branch: string; commit: string }[] = []

  for (const { position, commits, branch } of branchInfos) {
    const firstCommit = commits[0].hash
    try {
      const yamlAtCommit = getYamlAtCommit(firstCommit, season)
      const block = extractPositionBlock(yamlAtCommit, position)
      if (block) {
        rawYaml = replacePositionBlock(rawYaml, position, block)
      }
    } catch (err) {
      console.error(`  Warning: could not extract block for position ${position} from first commit: ${err}`)
    }
    // Track images from first commit
    rawImages.push({ path: `src/images/people/${season}/`, branch, commit: firstCommit })
  }

  // --- Build commit 2: Adjustments (all non-PROPOSED-EDIT commits applied) ---
  // For each branch, take the position block from the last non-PROPOSED-EDIT commit
  let adjYaml = rawYaml
  const adjustmentMessages: string[] = []

  for (const { position, commits } of branchInfos) {
    // Find the last commit that isn't a PROPOSED EDIT
    const nonProposed = commits.filter(
      (c) => !c.message.includes("PROPOSED EDIT"),
    )
    if (nonProposed.length <= 1) continue // only raw submission, no adjustments

    const lastAdjCommit = nonProposed[nonProposed.length - 1].hash
    try {
      const yamlAtCommit = getYamlAtCommit(lastAdjCommit, season)
      const block = extractPositionBlock(yamlAtCommit, position)
      if (block) {
        adjYaml = replacePositionBlock(adjYaml, position, block)
      }
    } catch (err) {
      console.error(`  Warning: could not extract adjusted block for position ${position}: ${err}`)
    }

    // Collect adjustment commit messages
    for (const c of nonProposed.slice(1)) {
      adjustmentMessages.push(c.message)
    }
  }

  // --- Build commit 3: PROPOSED EDITs ---
  // For each branch, take the position block from the very last commit (which includes PROPOSED EDIT)
  let proposedYaml = adjYaml
  const proposedReasonings: string[] = []
  let hasProposedEdits = false

  for (const { position, commits, branch } of branchInfos) {
    const lastCommit = commits[commits.length - 1]
    if (!lastCommit.message.includes("PROPOSED EDIT")) continue

    hasProposedEdits = true
    try {
      const yamlAtCommit = getYamlAtCommit(lastCommit.hash, season)
      const block = extractPositionBlock(yamlAtCommit, position)
      if (block) {
        proposedYaml = replacePositionBlock(proposedYaml, position, block)
      }
    } catch (err) {
      console.error(`  Warning: could not extract proposed edit block for position ${position}: ${err}`)
    }

    // Collect reasoning
    try {
      const body = git(`log -1 --format=%b ${lastCommit.hash}`)
      if (body) proposedReasonings.push(`Position ${position} (${branch}):\n${body}`)
    } catch {
      // ignore
    }
  }

  // --- Now create the review branch and write the commits ---
  const reviewBranch = `bio-review/${season}`

  try {
    git(`branch -D ${reviewBranch} 2>/dev/null`)
  } catch {
    // doesn't exist
  }

  git(`checkout -b ${reviewBranch} master`)

  // Commit 1: Raw submissions
  console.log(`\nWriting raw submissions...`)
  writeFileSync(yamlPath, rawYaml, "utf-8")
  // Also copy images from each branch's first commit
  for (const { position } of branchInfos) {
    const firstCommit = branchInfos.find((b) => b.position === position)!.commits[0].hash
    copyImagesFromCommit(firstCommit, season)
  }
  commitAll(`Raw bio submissions (${branchInfos.length} people)`)
  console.log(`  Committed raw submissions (${branchInfos.length} people)`)

  // Commit 2: Adjustments
  if (adjYaml !== rawYaml || adjustmentMessages.length) {
    console.log(`\nWriting adjustments...`)
    writeFileSync(yamlPath, adjYaml, "utf-8")
    // Also update images to their adjusted state
    for (const { position, commits } of branchInfos) {
      const nonProposed = commits.filter(
        (c) => !c.message.includes("PROPOSED EDIT"),
      )
      if (nonProposed.length <= 1) continue
      const lastAdjCommit = nonProposed[nonProposed.length - 1].hash
      copyImagesFromCommit(lastAdjCommit, season)
    }
    commitAll(`Bio adjustments (${adjustmentMessages.length} changes)`)
    console.log(`  Committed adjustments (${adjustmentMessages.length} changes)`)
  }

  // Commit 3: PROPOSED EDITs
  if (hasProposedEdits) {
    console.log(`\nWriting proposed edits...`)
    writeFileSync(yamlPath, proposedYaml, "utf-8")
    git("add -A")
    const body = proposedReasonings.join("\n\n---\n\n")
    commitWithMessageFile(
      `PROPOSED EDITS (${proposedReasonings.length} flags)\n\n${body}`,
    )
    console.log(`  Committed proposed edits (${proposedReasonings.length} flags)`)
  }

  checkoutBranch(startBranch)

  console.log(`\nDone. Review branch: ${reviewBranch}`)
  console.log(`  git log master..${reviewBranch} --stat`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
