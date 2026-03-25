import { execSync } from "child_process"
import { resolve, join, dirname } from "path"
import { writeFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { fileURLToPath } from "url"

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../../..")

export function git(args: string): string {
  return execSync(`git ${args}`, { cwd: repoRoot, encoding: "utf-8" }).trim()
}

/** Abort early if there are uncommitted changes that would block branch switching */
export function ensureCleanWorkingDir(): void {
  try {
    git("diff --quiet")
    git("diff --quiet --cached")
  } catch {
    console.error(
      "Error: You have uncommitted changes. Please commit or stash them before running this command.",
    )
    process.exit(1)
  }
}

/** Get the timestamp of the last change to a specific line pattern via git blame */
export function getBlameTimestamp(
  filePath: string,
  pattern: string,
  ref?: string,
): Date | null {
  try {
    const relPath = filePath.startsWith(repoRoot)
      ? filePath.slice(repoRoot.length + 1)
      : filePath
    const refArg = ref ? `${ref} ` : ""
    const blame = git(
      `blame --porcelain -L '/${pattern.replace(/'/g, "'\\''")}/,+1' ${refArg}-- "${relPath}"`,
    )
    const match = blame.match(/^committer-time (\d+)$/m)
    if (!match) return null
    return new Date(parseInt(match[1]) * 1000)
  } catch {
    return null
  }
}

/**
 * Returns the newest committer-time among all lines between
 * `# start __N__` and `# end __N__` for a given position, on the given ref.
 * This captures edits to the actual bio content, not just the marker line.
 */
export function getPositionBlameTimestamp(
  filePath: string,
  position: number,
  ref?: string,
): Date | null {
  try {
    const relPath = filePath.startsWith(repoRoot)
      ? filePath.slice(repoRoot.length + 1)
      : filePath
    const refArg = ref ? `${ref} ` : ""
    const startPattern = `# start __${position}__`
    const endPattern = `# end __${position}__`

    // git blame -L doesn't support /regex/+N offset syntax, so find line numbers first
    const startGrep = git(`grep -Fn "${startPattern}" ${refArg}-- "${relPath}"`)
    const endGrep = git(`grep -Fn "${endPattern}" ${refArg}-- "${relPath}"`)
    // Output: "file:linenum:content" or "ref:file:linenum:content" — find first numeric field
    const startLine = parseInt(startGrep.split(":").find((p) => /^\d+$/.test(p))!)
    const endLine = parseInt(endGrep.split(":").find((p) => /^\d+$/.test(p))!)

    // Exclude the marker lines themselves
    const contentStart = startLine + 1
    const contentEnd = endLine - 1
    if (contentStart > contentEnd) return null

    const blame = git(
      `blame --porcelain -L ${contentStart},${contentEnd} ${refArg}-- "${relPath}"`,
    )
    // Extract all committer-time values and return the newest
    const times = [...blame.matchAll(/^committer-time (\d+)$/gm)].map((m) =>
      parseInt(m[1]),
    )
    if (!times.length) return null
    return new Date(Math.max(...times) * 1000)
  } catch {
    return null
  }
}

/** Fetch remote bio-update branches and create local tracking branches */
export function fetchRemoteBioUpdateBranches(): void {
  try {
    git("fetch origin 'refs/heads/bio-update/*:refs/remotes/origin/bio-update/*'")
  } catch {
    // fetch may fail if no remote branches exist
    return
  }

  // Create local branches for any remote-only bio-update branches
  let remoteBranches: string
  try {
    remoteBranches = git(
      `branch -r --list "origin/bio-update/position-*" --format="%(refname:short)"`,
    )
  } catch {
    return
  }
  if (!remoteBranches) return

  for (const remote of remoteBranches.split("\n").filter(Boolean)) {
    const local = remote.replace(/^origin\//, "")
    try {
      // Only create if local branch doesn't already exist
      git(`rev-parse --verify ${local}`)
    } catch {
      // Local branch doesn't exist — create it tracking the remote
      try {
        git(`branch ${local} ${remote}`)
        console.log(`  Created local branch ${local} from remote`)
      } catch {
        // ignore if it fails
      }
    }
  }
}

/** List all bio-update branches with their first commit date */
export function listBioUpdateBranches(): {
  branch: string
  position: number
  date: Date
}[] {
  let branches: string
  try {
    branches = git(
      `branch --list "bio-update/position-*" --format="%(refname:short)"`,
    )
  } catch {
    return []
  }
  if (!branches) return []

  return branches
    .split("\n")
    .filter(Boolean)
    .map((branch) => {
      const position = parseInt(branch.split("-").pop()!)
      let dateStr: string
      try {
        dateStr = git(
          `log master..${branch} --reverse --format=%aI | head -1`,
        )
      } catch {
        dateStr = git(`log -1 --format=%aI ${branch}`)
      }
      return { branch, position, date: new Date(dateStr) }
    })
}

/** Create a branch off master at the current HEAD */
export function createBranch(branchName: string): void {
  try {
    git(`branch ${branchName} master`)
  } catch {
    // Branch may already exist
    git(`checkout ${branchName}`)
    git(`reset --hard master`)
  }
}

/** Switch to a branch */
export function checkoutBranch(branchName: string): void {
  git(`checkout ${branchName}`)
}

/** Switch back to master */
export function checkoutMaster(): void {
  git(`checkout master`)
}

/**
 * Stage files and commit. Uses a temp file for the commit message to avoid
 * shell escaping issues with special characters in messages.
 * Returns true if a commit was made, false if nothing to commit.
 */
export function commitFiles(
  files: string[],
  message: string,
  body?: string,
): boolean {
  for (const f of files) {
    git(`add "${f}"`)
  }
  try {
    git("diff --cached --quiet")
    return false
  } catch {
    const fullMessage = body ? `${message}\n\n${body}` : message
    commitWithMessageFile(fullMessage)
    return true
  }
}

/** Stage all changes and commit */
export function commitAll(message: string, body?: string): boolean {
  git("add -A")
  try {
    git("diff --cached --quiet")
    return false
  } catch {
    const fullMessage = body ? `${message}\n\n${body}` : message
    commitWithMessageFile(fullMessage)
    return true
  }
}

/** Get current branch name */
export function currentBranch(): string {
  return git("rev-parse --abbrev-ref HEAD")
}

/** Check if any commit on the current branch (ahead of master) has a given message prefix */
export function branchHasCommit(messagePrefix: string): boolean {
  try {
    const log = git(`log master..HEAD --format=%s`)
    return log.split("\n").some((line) => line.startsWith(messagePrefix))
  } catch {
    return false
  }
}

/**
 * Write message to a temp file and commit with --file to avoid shell escaping
 * issues with quotes, backticks, dollar signs, etc. in commit messages.
 */
export function commitWithMessageFile(message: string): void {
  const msgFile = join(tmpdir(), `bio-tool-commit-msg-${Date.now()}.txt`)
  try {
    writeFileSync(msgFile, message)
    git(`commit --file="${msgFile}"`)
  } finally {
    try {
      unlinkSync(msgFile)
    } catch {
      // ignore cleanup errors
    }
  }
}
