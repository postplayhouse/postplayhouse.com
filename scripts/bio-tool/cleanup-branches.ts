import { checkbox } from "@inquirer/prompts"
import {
  git,
  fetchRemoteBioUpdateBranches,
  checkoutBranch,
  checkoutMaster,
  currentBranch,
} from "./lib/git"

interface BranchInfo {
  branch: string
  merged: boolean
  hasRemote: boolean
}

function listAllBioUpdateBranches(): BranchInfo[] {
  let localBranches: string[]
  try {
    const output = git(
      `branch --list "bio-update/position-*" --format="%(refname:short)"`,
    )
    localBranches = output ? output.split("\n").filter(Boolean) : []
  } catch {
    localBranches = []
  }

  const positionNumber = (b: string) => parseInt(b.match(/position-(\d+)/)?.[1] ?? "0")
  localBranches.sort((a, b) => positionNumber(a) - positionNumber(b))

  return localBranches.map((branch) => {
    // Check if branch content is already on master (bio data matches)
    let merged = false
    try {
      const diff = git(`diff master..${branch} -- src/data/people/`)
      merged = diff === ""
    } catch {
      // If diff fails, assume not merged
    }

    // Check if remote exists
    let hasRemote = false
    try {
      git(`rev-parse --verify origin/${branch}`)
      hasRemote = true
    } catch {
      // no remote
    }

    return { branch, merged, hasRemote }
  })
}

const deleteLocal = process.argv.includes("--local")
const deleteRemote = process.argv.includes("--remote")
const dryRun = !deleteLocal && !deleteRemote

async function main() {
  const startBranch = currentBranch()

  console.log("Fetching remote bio-update branches...")
  fetchRemoteBioUpdateBranches()

  checkoutMaster()

  const branches = listAllBioUpdateBranches()

  if (!branches.length) {
    console.log("No bio-update branches found.")
    return
  }

  const merged = branches.filter((b) => b.merged)
  const unmerged = branches.filter((b) => !b.merged)

  console.log(
    `Found ${branches.length} branches: ${merged.length} merged, ${unmerged.length} unmerged\n`,
  )

  if (dryRun) {
    for (const b of branches) {
      const status = b.merged ? "merged" : "unmerged"
      const location = b.hasRemote ? "local + remote" : "local only"
      console.log(`  ${b.branch} (${status}) [${location}]`)
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
      name: `${b.branch} (merged)${locationLabel(b)}`,
      value: b,
      checked: true,
    })),
    ...unmerged.map((b) => ({
      name: `${b.branch} (unmerged)${locationLabel(b)}`,
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
