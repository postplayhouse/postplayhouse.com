import { checkbox } from "@inquirer/prompts"
import {
  git,
  fetchRemoteBioUpdateBranches,
  fetchRemoteBioReviewBranches,
  checkoutBranch,
  checkoutMaster,
  currentBranch,
} from "./lib/git"

type BranchKind = "update" | "review"

interface BranchInfo {
  branch: string
  kind: BranchKind
  merged: boolean
  hasRemote: boolean
}

function statusLabel(b: BranchInfo): string {
  if (b.kind === "review") return "review branch"
  return b.merged ? "merged" : "unmerged"
}

function listBranchesByPattern(pattern: string): string[] {
  try {
    const output = git(`branch --list "${pattern}" --format="%(refname:short)"`)
    return output ? output.split("\n").filter(Boolean) : []
  } catch {
    return []
  }
}

function sortKey(branch: string): [number, number] {
  const updateMatch = branch.match(/^bio-update\/position-(\d+)$/)
  if (updateMatch) return [0, parseInt(updateMatch[1])]
  const reviewMatch = branch.match(/^bio-review\/(\d+)$/)
  if (reviewMatch) return [1, parseInt(reviewMatch[1])]
  return [2, 0]
}

function buildBranchInfo(branch: string): BranchInfo {
  const kind: BranchKind = branch.startsWith("bio-review/") ? "review" : "update"

  // Only bio-update branches have a meaningful merged/unmerged signal —
  // bio-review branches are workspace collections, not mergeable units.
  let merged = false
  if (kind === "update") {
    try {
      const diff = git(`diff master..${branch} -- src/data/people/`)
      merged = diff === ""
    } catch {
      // If diff fails, assume not merged
    }
  }

  let hasRemote = false
  try {
    git(`rev-parse --verify origin/${branch}`)
    hasRemote = true
  } catch {
    // no remote
  }

  return { branch, kind, merged, hasRemote }
}

function listAllBioBranches(): BranchInfo[] {
  const branches = [
    ...listBranchesByPattern("bio-update/position-*"),
    ...listBranchesByPattern("bio-review/*"),
  ]

  branches.sort((a, b) => {
    const [groupA, numA] = sortKey(a)
    const [groupB, numB] = sortKey(b)
    if (groupA !== groupB) return groupA - groupB
    return numA - numB
  })

  return branches.map(buildBranchInfo)
}

const deleteLocal = process.argv.includes("--local")
const deleteRemote = process.argv.includes("--remote")
const dryRun = !deleteLocal && !deleteRemote

async function main() {
  const startBranch = currentBranch()

  console.log("Fetching remote bio-update and bio-review branches...")
  fetchRemoteBioUpdateBranches()
  fetchRemoteBioReviewBranches()

  checkoutMaster()

  const branches = listAllBioBranches()

  if (!branches.length) {
    console.log("No bio-update or bio-review branches found.")
    return
  }

  const merged = branches.filter((b) => b.kind === "update" && b.merged)
  const unmerged = branches.filter((b) => b.kind === "update" && !b.merged)
  const review = branches.filter((b) => b.kind === "review")

  console.log(
    `Found ${branches.length} branches: ${merged.length} merged, ${unmerged.length} unmerged, ${review.length} review\n`,
  )

  if (dryRun) {
    for (const b of branches) {
      const location = b.hasRemote ? "local + remote" : "local only"
      console.log(`  ${b.branch} (${statusLabel(b)}) [${location}]`)
    }
    console.log("\nPass --local and/or --remote to delete branches.")
    checkoutBranch(startBranch)
    return
  }

  const targets = [
    deleteLocal && "local",
    deleteRemote && "remote",
  ].filter(Boolean).join(" + ")

  function locationLabel(b: BranchInfo): string {
    if (deleteLocal && deleteRemote) return b.hasRemote ? " [local + remote]" : " [local only]"
    if (deleteRemote && !b.hasRemote) return " [no remote]"
    return ""
  }

  const choices = [
    ...merged.map((b) => ({
      name: `${b.branch} (${statusLabel(b)})${locationLabel(b)}`,
      value: b,
      checked: true,
    })),
    ...unmerged.map((b) => ({
      name: `${b.branch} (${statusLabel(b)})${locationLabel(b)}`,
      value: b,
      checked: false,
    })),
    ...review.map((b) => ({
      name: `${b.branch} (${statusLabel(b)})${locationLabel(b)}`,
      value: b,
      checked: false,
    })),
  ]

  const selected = await checkbox({
    message: `Select branches to delete (${targets}):`,
    choices,
  })

  if (!selected.length) {
    console.log("Nothing selected.")
    checkoutBranch(startBranch)
    return
  }

  for (const { branch, hasRemote } of selected) {
    if (deleteLocal) {
      try {
        git(`branch -D ${branch}`)
        console.log(`  Deleted local: ${branch}`)
      } catch (err) {
        console.error(`  Failed to delete local ${branch}:`, err)
      }
    }

    if (deleteRemote && hasRemote) {
      try {
        git(`push origin --delete ${branch}`)
        console.log(`  Deleted remote: ${branch}`)
      } catch (err) {
        console.error(`  Failed to delete remote ${branch}:`, err)
      }
    }
  }

  checkoutBranch(startBranch)
  console.log("\nDone.")
}

main().catch((err) => {
  if (err?.name === "ExitPromptError") {
    console.log("\nExited.")
    process.exit(0)
  }
  console.error(err)
  process.exit(1)
})
