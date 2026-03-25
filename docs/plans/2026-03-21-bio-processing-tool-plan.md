# Bio Processing Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automate processing of bio submissions from B2 and GitHub PRs — normalizing them into branches, then running photo dedup, link formatting, italics fixes, and content flagging as discrete commits.

**Architecture:** Two entry-point scripts (`fetch-b2-submissions.ts` and `process-bios.ts`) with shared library modules under `scripts/bio-tool/lib/`. The fetch script normalizes B2 submissions into `bio-update/position-*` branches. The process script iterates all such branches (current year only), running non-Claude transforms first, then a single Claude CLI pass that produces up to two commits.

**Tech Stack:** TypeScript (run via `pnpm dlx tsx`), Node built-ins (`child_process`, `fs`, `path`), `dotenv` for env loading, `js-yaml` (already a project dependency), `imghash`+`jpeg-js`+`pngjs` for perceptual hashing, `claude` CLI for AI pass.

---

### Task 1: Project scaffolding and env loading

**Files:**
- Create: `scripts/bio-tool/lib/env.ts`
- Create: `scripts/bio-tool/lib/season.ts`

**Step 1: Create `lib/env.ts`**

This loads `.env` from the project root using `dotenv` so scripts have access to B2 credentials.

```typescript
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(import.meta.dirname, "../../../.env") })

export function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}
```

**Step 2: Create `lib/season.ts`**

Determines the current season by finding the highest-numbered `.yml` file in `src/data/people/`.

```typescript
import { readdirSync } from "fs"
import { resolve } from "path"

const peopleDir = resolve(import.meta.dirname, "../../../src/data/people")

export function getCurrentSeason(): number {
  const years = readdirSync(peopleDir)
    .filter((f) => /^\d{4}\.yml$/.test(f))
    .map((f) => parseInt(f))
    .sort((a, b) => b - a)

  if (!years.length) throw new Error("No season YAML files found")
  return years[0]
}

export function seasonYamlPath(season: number): string {
  return resolve(peopleDir, `${season}.yml`)
}

export function imagesDir(season: number): string {
  return resolve(import.meta.dirname, `../../../src/images/people/${season}`)
}
```

**Step 3: Verify it runs**

Run: `pnpm dlx tsx -e "import { getCurrentSeason } from './scripts/bio-tool/lib/season'; console.log(getCurrentSeason())"`
Expected: `2026`

**Step 4: Commit**

```bash
git add scripts/bio-tool/lib/env.ts scripts/bio-tool/lib/season.ts
git commit -m "feat(bio-tool): add env loading and season detection"
```

---

### Task 2: YAML block parsing and replacement

**Files:**
- Create: `scripts/bio-tool/lib/yaml.ts`
- Test: `scripts/bio-tool/lib/yaml.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest"
import { extractPositionBlock, replacePositionBlock } from "./yaml"

const sampleYaml = `# start __3__
- last_name: Denton
  first_name: Don
  bio: |
    Some bio text
# end __3__
# start __2__
- last_name: Smith
  first_name: Jane
  bio: |
    Another bio
# end __2__`

describe("extractPositionBlock", () => {
  it("extracts content between position markers", () => {
    const result = extractPositionBlock(sampleYaml, 3)
    expect(result).toContain("last_name: Denton")
    expect(result).not.toContain("last_name: Smith")
  })

  it("returns null for missing position", () => {
    expect(extractPositionBlock(sampleYaml, 99)).toBeNull()
  })
})

describe("replacePositionBlock", () => {
  it("replaces content between markers", () => {
    const newBio = `- last_name: Updated
  first_name: Don
  bio: |
    New bio`
    const result = replacePositionBlock(sampleYaml, 3, newBio)
    expect(result).toContain("last_name: Updated")
    expect(result).toContain("last_name: Smith")
    expect(result).not.toContain("last_name: Denton")
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts/bio-tool/lib/yaml.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
import { readFileSync, writeFileSync } from "fs"

export function extractPositionBlock(
  yamlContent: string,
  position: number,
): string | null {
  const startTag = `# start __${position}__`
  const endTag = `# end __${position}__`
  const startIdx = yamlContent.indexOf(startTag)
  const endIdx = yamlContent.indexOf(endTag)

  if (startIdx === -1 || endIdx === -1) return null

  return yamlContent.slice(startIdx + startTag.length + 1, endIdx).trimEnd()
}

export function replacePositionBlock(
  yamlContent: string,
  position: number,
  newContent: string,
): string {
  const startTag = `# start __${position}__`
  const endTag = `# end __${position}__`
  const startIdx = yamlContent.indexOf(startTag)
  const endIdx = yamlContent.indexOf(endTag)

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Position markers not found for __${position}__`)
  }

  return `${yamlContent.slice(0, startIdx + startTag.length)}\n${newContent}\n${yamlContent.slice(endIdx)}`
}

export function readSeasonYaml(path: string): string {
  return readFileSync(path, "utf-8")
}

export function writeSeasonYaml(path: string, content: string): void {
  writeFileSync(path, content, "utf-8")
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run scripts/bio-tool/lib/yaml.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/bio-tool/lib/yaml.ts scripts/bio-tool/lib/yaml.test.ts
git commit -m "feat(bio-tool): add YAML position block parsing and replacement"
```

---

### Task 3: Git operations library

**Files:**
- Create: `scripts/bio-tool/lib/git.ts`

**Step 1: Write `lib/git.ts`**

Wraps git operations needed by both scripts: branch creation, blame timestamps, committing, listing branches.

```typescript
import { execSync } from "child_process"
import { resolve } from "path"

const repoRoot = resolve(import.meta.dirname, "../../..")

function git(args: string): string {
  return execSync(`git ${args}`, { cwd: repoRoot, encoding: "utf-8" }).trim()
}

/** Get the timestamp of the last change to a specific line pattern via git blame */
export function getBlameTimestamp(
  filePath: string,
  pattern: string,
): Date | null {
  try {
    // Find the line number containing the pattern
    const relPath = filePath.startsWith(repoRoot)
      ? filePath.slice(repoRoot.length + 1)
      : filePath
    const blame = git(
      `blame --porcelain -L '/${pattern.replace(/'/g, "'\\''")}/,+1' -- "${relPath}"`,
    )
    const match = blame.match(/^committer-time (\d+)$/m)
    if (!match) return null
    return new Date(parseInt(match[1]) * 1000)
  } catch {
    return null
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
    branches = git(`branch --list "bio-update/position-*" --format="%(refname:short)"`)
  } catch {
    return []
  }
  if (!branches) return []

  return branches
    .split("\n")
    .filter(Boolean)
    .map((branch) => {
      const position = parseInt(branch.split("-").pop()!)
      // Get the date of the first commit on this branch (relative to master)
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
    // Branch may already exist — check it out and reset
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

/** Stage files and commit. Returns true if a commit was made, false if nothing to commit. */
export function commitFiles(
  files: string[],
  message: string,
  body?: string,
): boolean {
  for (const f of files) {
    git(`add "${f}"`)
  }

  // Check if there are staged changes
  try {
    git("diff --cached --quiet")
    return false // no changes
  } catch {
    // There are staged changes — commit
    const fullMessage = body ? `${message}\n\n${body}` : message
    git(`commit -m "${fullMessage.replace(/"/g, '\\"')}"`)
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
    git(`commit -m "${fullMessage.replace(/"/g, '\\"')}"`)
    return true
  }
}

/** Get current branch name */
export function currentBranch(): string {
  return git("rev-parse --abbrev-ref HEAD")
}
```

**Step 2: Verify it loads**

Run: `pnpm dlx tsx -e "import { listBioUpdateBranches } from './scripts/bio-tool/lib/git'; console.log(listBioUpdateBranches())"`
Expected: Array (possibly empty) of branch objects

**Step 3: Commit**

```bash
git add scripts/bio-tool/lib/git.ts
git commit -m "feat(bio-tool): add git operations library"
```

---

### Task 4: B2 API client

**Files:**
- Create: `scripts/bio-tool/lib/b2.ts`

**Step 1: Write `lib/b2.ts`**

Handles B2 auth, file listing, and downloading. Uses the same API patterns as the app's `upload-url/+server.ts`.

```typescript
import { requireEnv } from "./env"

interface B2AuthResponse {
  accountId: string
  authorizationToken: string
  apiUrl: string
  downloadUrl: string
}

interface B2File {
  fileName: string
  fileId: string
  contentLength: number
  uploadTimestamp: number
}

interface B2ListFilesResponse {
  files: B2File[]
  nextFileName: string | null
}

let cachedAuth: B2AuthResponse | null = null

async function authorize(): Promise<B2AuthResponse> {
  if (cachedAuth) return cachedAuth

  const keyId = requireEnv("B2_APPLICATION_KEY_ID")
  const key = requireEnv("B2_APPLICATION_KEY")
  const auth = "Basic " + Buffer.from(`${keyId}:${key}`).toString("base64")

  const resp = await fetch(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    {
      method: "GET",
      headers: { Authorization: auth },
    },
  )

  if (!resp.ok) throw new Error(`B2 auth failed: ${resp.status}`)
  cachedAuth = (await resp.json()) as B2AuthResponse
  return cachedAuth
}

/** List all files in the bucket */
export async function listFiles(): Promise<B2File[]> {
  const auth = await authorize()
  const bucketId = requireEnv("B2_BUCKET_ID")
  const allFiles: B2File[] = []
  let nextFileName: string | null = null

  do {
    const body: Record<string, unknown> = {
      bucketId,
      maxFileCount: 1000,
    }
    if (nextFileName) body.startFileName = nextFileName

    const resp = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
      method: "POST",
      headers: { Authorization: auth.authorizationToken },
      body: JSON.stringify(body),
    })

    if (!resp.ok) throw new Error(`B2 list files failed: ${resp.status}`)
    const data = (await resp.json()) as B2ListFilesResponse
    allFiles.push(...data.files)
    nextFileName = data.nextFileName
  } while (nextFileName)

  return allFiles
}

/** Download a file by name */
export async function downloadFile(fileName: string): Promise<Buffer> {
  const auth = await authorize()
  const bucketId = requireEnv("B2_BUCKET_ID")

  // Get bucket name from the auth allowed field, or derive from download URL
  const resp = await fetch(
    `${auth.downloadUrl}/file/${bucketId}/${fileName}`,
    {
      headers: { Authorization: auth.authorizationToken },
    },
  )

  if (!resp.ok) {
    // Try alternate download method via API
    const resp2 = await fetch(
      `${auth.apiUrl}/b2api/v2/b2_download_file_by_name`,
      {
        method: "GET",
        headers: { Authorization: auth.authorizationToken },
      },
    )
    if (!resp2.ok) throw new Error(`B2 download failed for ${fileName}: ${resp.status}`)
    return Buffer.from(await resp2.arrayBuffer())
  }

  return Buffer.from(await resp.arrayBuffer())
}

/** Download a file by ID (more reliable) */
export async function downloadFileById(fileId: string): Promise<Buffer> {
  const auth = await authorize()

  const resp = await fetch(
    `${auth.downloadUrl}/b2api/v2/b2_download_file_by_id?fileId=${fileId}`,
    {
      headers: { Authorization: auth.authorizationToken },
    },
  )

  if (!resp.ok) throw new Error(`B2 download by ID failed for ${fileId}: ${resp.status}`)
  return Buffer.from(await resp.arrayBuffer())
}

/** Parse a B2 bio submission filename: `{timestamp}-{first}-{last}.txt` */
export function parseSubmissionFilename(fileName: string): {
  timestamp: number
  firstName: string
  lastName: string
} | null {
  const match = fileName.match(/^(\d+)-(.+)\.txt$/)
  if (!match) return null

  const timestamp = parseInt(match[1])
  const nameParts = match[2].split("-")

  // First name is the first part, last name is everything after
  // e.g., "john-doe" -> first: john, last: doe
  // e.g., "mary-jane-smith" -> first: mary-jane, last: smith
  // We can't perfectly split, but convention seems to be first-last
  if (nameParts.length < 2) return null

  return {
    timestamp,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join("-"),
  }
}

/** Find a matching image file for a bio submission basename */
export function findMatchingImage(
  allFiles: B2File[],
  basename: string,
): B2File | null {
  // Image files have same basename but image extension
  const imageExts = [".jpg", ".jpeg", ".png", ".webp"]
  return (
    allFiles.find((f) =>
      imageExts.some((ext) => f.fileName === `${basename}${ext}`),
    ) ?? null
  )
}
```

**Step 2: Commit**

```bash
git add scripts/bio-tool/lib/b2.ts
git commit -m "feat(bio-tool): add B2 API client for listing and downloading files"
```

---

### Task 5: `fetch-b2-submissions.ts` entry point

**Files:**
- Create: `scripts/bio-tool/fetch-b2-submissions.ts`

**Step 1: Write the fetch script**

```typescript
import "./lib/env"
import { listFiles, downloadFileById, parseSubmissionFilename, findMatchingImage } from "./lib/b2"
import { getCurrentSeason, seasonYamlPath, imagesDir } from "./lib/season"
import { readSeasonYaml, replacePositionBlock } from "./lib/yaml"
import {
  getBlameTimestamp,
  createBranch,
  checkoutBranch,
  checkoutMaster,
  commitAll,
} from "./lib/git"
import { writeFileSync, mkdirSync } from "fs"
import { resolve } from "path"

async function main() {
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)
  console.log(`Current season: ${season}`)

  const allFiles = await listFiles()
  console.log(`Found ${allFiles.length} files in B2 bucket`)

  // Filter to .txt bio submissions
  const bioFiles = allFiles.filter((f) => f.fileName.endsWith(".txt"))
  console.log(`Found ${bioFiles.length} bio submission files`)

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
    const content = (await downloadFileById(file.fileId)).toString("utf-8")

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

    // Check git blame timestamp for this position
    const blameDate = getBlameTimestamp(
      yamlPath,
      `# start __${position}__`,
    )

    if (blameDate && blameDate > b2Date) {
      console.log(
        `  Skipping position ${position} (${parsed.firstName} ${parsed.lastName}): ` +
          `YAML was updated ${blameDate.toISOString()} after B2 submission ${b2Date.toISOString()}`,
      )
      skipped++
      continue
    }

    console.log(
      `  Processing position ${position}: ${parsed.firstName} ${parsed.lastName}`,
    )

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
      const imageData = await downloadFileById(imageFile.fileId)
      writeFileSync(resolve(imgDir, imageName), imageData)
      console.log(`    Downloaded image: ${imageName}`)
    }

    // Commit
    const name = `${capitalize(parsed.firstName)} ${capitalize(parsed.lastName)}`
    commitAll(`Bio submission from ${name}`)
    console.log(`    Created branch: ${branchName}`)
    processed++
  }

  checkoutMaster()
  console.log(
    `\nDone. Processed: ${processed}, Skipped: ${skipped}`,
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

**Step 2: Test manually**

Run: `pnpm dlx tsx scripts/bio-tool/fetch-b2-submissions.ts`
Expected: Lists B2 files, creates branches for new submissions, skips already-processed ones.

**Step 3: Commit**

```bash
git add scripts/bio-tool/fetch-b2-submissions.ts
git commit -m "feat(bio-tool): add B2 fetch script to create branches from submissions"
```

---

### Task 6: Image perceptual hashing

**Files:**
- Create: `scripts/bio-tool/lib/image.ts`

**Step 1: Install dependency**

Run: `pnpm add -D imghash jpeg-js pngjs`

Note: `imghash` provides perceptual hashing. It depends on `jpeg-js` and `pngjs` for decoding.

**Step 2: Write `lib/image.ts`**

```typescript
import { execSync } from "child_process"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

// Use imghash for perceptual hashing
import imghash from "imghash"

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

  // Convert hex strings to binary and compare
  const binA = BigInt("0x" + a)
  const binB = BigInt("0x" + b)
  const xor = binA ^ binB

  // Count set bits
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
  const imagesBase = resolve(
    import.meta.dirname,
    "../../../src/images/people",
  )
  const kebabName = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z]+/g, "-")

  // Search backwards through previous seasons
  for (let year = currentSeason - 1; year >= 2015; year--) {
    const yearDir = resolve(imagesBase, String(year))
    const extensions = [".jpg", ".jpeg", ".png", ".webp"]

    for (const ext of extensions) {
      const candidate = resolve(yearDir, `${kebabName}${ext}`)
      if (existsSync(candidate)) {
        return { path: candidate, year }
      }
    }
  }

  return null
}
```

**Step 3: Commit**

```bash
git add scripts/bio-tool/lib/image.ts
git commit -m "feat(bio-tool): add perceptual image hashing and previous image lookup"
```

---

### Task 7: Bio text transforms (Instagram, URLs)

**Files:**
- Create: `scripts/bio-tool/lib/bio-transforms.ts`
- Test: `scripts/bio-tool/lib/bio-transforms.test.ts`

**Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from "vitest"
import { linkInstagramHandles, linkBareUrls } from "./bio-transforms"

describe("linkInstagramHandles", () => {
  it("converts @handle to instagram link", () => {
    const input = "Follow me @johndoe on social media"
    expect(linkInstagramHandles(input)).toBe(
      "Follow me [@johndoe](https://www.instagram.com/johndoe) on social media",
    )
  })

  it("converts 'Instagram: handle' format", () => {
    const input = "Instagram: johndoe"
    expect(linkInstagramHandles(input)).toBe(
      "Instagram: [@johndoe](https://www.instagram.com/johndoe)",
    )
  })

  it("converts 'IG: @handle' format", () => {
    const input = "IG: @johndoe"
    expect(linkInstagramHandles(input)).toBe(
      "IG: [@johndoe](https://www.instagram.com/johndoe)",
    )
  })

  it("skips handles already in markdown links", () => {
    const input = "Follow [@johndoe](https://www.instagram.com/johndoe)"
    expect(linkInstagramHandles(input)).toBe(input)
  })

  it("returns null if no changes", () => {
    expect(linkInstagramHandles("No handles here")).toBeNull()
  })
})

describe("linkBareUrls", () => {
  it("converts www.example.com to markdown link", () => {
    const input = "Visit www.example.com for more"
    expect(linkBareUrls(input)).toBe(
      "Visit [www.example.com](https://www.example.com) for more",
    )
  })

  it("converts http:// URLs", () => {
    const input = "See http://example.com/page"
    expect(linkBareUrls(input)).toBe(
      "See [example.com/page](http://example.com/page) for more",
    )
  })

  it("skips URLs already in markdown links", () => {
    const input = "[my site](https://example.com)"
    expect(linkBareUrls(input)).toBe(input)
  })

  it("returns null if no changes", () => {
    expect(linkBareUrls("No URLs here")).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts/bio-tool/lib/bio-transforms.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
import { execSync } from "child_process"

/**
 * Find and convert Instagram handles to markdown links.
 * Returns the modified text, or null if no changes were made.
 */
export function linkInstagramHandles(text: string): string | null {
  let changed = false
  let result = text

  // Pattern: @handle (not already inside a markdown link)
  result = result.replace(
    /(?<!\[)@([a-zA-Z0-9_.]+)(?!\])/g,
    (match, handle) => {
      changed = true
      return `[@${handle}](https://www.instagram.com/${handle})`
    },
  )

  // Pattern: "Instagram: handle" or "IG: @handle"
  result = result.replace(
    /(?:Instagram|IG):\s*@?([a-zA-Z0-9_.]+)(?!\])/gi,
    (match, handle) => {
      // If we already converted the @handle above, this might double-convert
      // Check if this portion already has a markdown link
      if (match.includes("](")) return match
      changed = true
      const prefix = match.match(/^(?:Instagram|IG):\s*/i)?.[0] ?? ""
      return `${prefix}[@${handle}](https://www.instagram.com/${handle})`
    },
  )

  return changed ? result : null
}

/**
 * Find bare URLs and convert to markdown links.
 * Returns the modified text, or null if no changes were made.
 */
export function linkBareUrls(text: string): string | null {
  let changed = false
  let result = text

  // Match URLs not already inside markdown link syntax
  // Negative lookbehind for ( or [ to avoid already-linked URLs
  const urlPattern =
    /(?<!\(|]\()(?:https?:\/\/|www\.)[^\s),>]+/g

  result = result.replace(urlPattern, (url) => {
    // Check if this URL is part of a markdown link by looking at surrounding context
    const idx = result.indexOf(url)
    const before = result.slice(Math.max(0, idx - 2), idx)
    if (before === "](" || before.endsWith("(")) return url

    changed = true
    const fullUrl = url.startsWith("www.") ? `https://${url}` : url
    const displayUrl = url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
    return `[${displayUrl}](${fullUrl})`
  })

  return changed ? result : null
}

/**
 * Verify a URL is reachable. Returns status info (does not throw).
 */
export async function verifyUrl(url: string): Promise<{
  url: string
  reachable: boolean
  status?: number
  redirectedTo?: string
}> {
  try {
    const resp = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    })
    return {
      url,
      reachable: resp.ok,
      status: resp.status,
      redirectedTo: resp.redirected ? resp.url : undefined,
    }
  } catch {
    return { url, reachable: false }
  }
}

/** Extract all URLs from markdown link syntax */
export function extractUrls(text: string): string[] {
  const matches = text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)
  return [...matches].map((m) => m[1])
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run scripts/bio-tool/lib/bio-transforms.test.ts`
Expected: PASS (some tests may need adjusting — verify exact output)

**Step 5: Commit**

```bash
git add scripts/bio-tool/lib/bio-transforms.ts scripts/bio-tool/lib/bio-transforms.test.ts
git commit -m "feat(bio-tool): add Instagram and URL linking transforms"
```

---

### Task 8: Claude CLI integration

**Files:**
- Create: `scripts/bio-tool/lib/claude.ts`

**Step 1: Write `lib/claude.ts`**

Invokes the `claude` CLI with a structured prompt and parses the JSON response.

```typescript
import { execSync } from "child_process"

interface ClaudeResponse {
  italicsFixed: string | null // The corrected bio text, or null if no changes
  contentFlag: {
    flagged: boolean
    cleanedText?: string
    reasoning?: string
  }
}

/**
 * Send bio text to Claude CLI for italics fixing and content flagging.
 * Returns structured response with both results.
 */
export function processBioWithClaude(
  bioText: string,
  programBioText: string | null,
  currentSeasonShows: string[],
): ClaudeResponse {
  const showsList = currentSeasonShows.join(", ")

  const prompt = `You are processing a theatre performer's bio for Post Playhouse, a summer musical theatre company in Nebraska. They produce children's theatre and serve a conservative audience.

CURRENT SEASON SHOWS: ${showsList}

BIO TEXT:
${bioText}
${programBioText ? `\nLONGER BIO TEXT:\n${programBioText}` : ""}

Do TWO things and respond in EXACTLY this JSON format (no other text):

{
  "bio": "the bio text with italics fixes applied, or null if no changes needed",
  "programBio": "the longer bio text with italics fixes applied, or null if no changes needed or no longer bio provided",
  "contentFlag": {
    "flagged": true/false,
    "cleanedBio": "bio with offensive content removed (only if flagged)",
    "cleanedProgramBio": "longer bio with offensive content removed (only if flagged and longer bio exists)",
    "reasoning": "explanation of what was flagged and why (only if flagged)"
  }
}

TASK 1 — ITALICS: Find show/musical/play titles that should be italicized with *Title* markdown syntax. Use your knowledge of the current season shows listed above AND your general knowledge of Broadway, Off-Broadway, regional theatre, film, and TV titles. Also use context clues (e.g., "appeared in X", "starred in X", "roles include X"). Do NOT italicize generic words, venue names, or company names. Only wrap actual show/production titles.

TASK 2 — CONTENT FLAG: Flag anything potentially inappropriate for a conservative, family-friendly audience including children. This includes sexually explicit content, strong profanity, graphic violence, or show titles that might be alarming in a children's theatre program (e.g., aggressively titled shows). Be judicious — most theatre content is fine. Only flag genuinely concerning items. If flagged, provide a cleaned version with the concerning content removed or softened.

Respond with ONLY the JSON object, no markdown code fences.`

  const result = execSync(
    `echo ${JSON.stringify(prompt)} | claude --print`,
    {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
      timeout: 60000,
    },
  )

  try {
    const parsed = JSON.parse(result.trim())
    return {
      italicsFixed: parsed.bio || parsed.programBio ? {
        bio: parsed.bio,
        programBio: parsed.programBio,
      } as any : null,
      contentFlag: {
        flagged: parsed.contentFlag?.flagged ?? false,
        cleanedText: parsed.contentFlag?.cleanedBio,
        reasoning: parsed.contentFlag?.reasoning,
      },
    }
  } catch (err) {
    console.error("Failed to parse Claude response:", result)
    throw new Error("Claude returned invalid JSON")
  }
}
```

Note: The exact Claude CLI invocation and response parsing will likely need adjustment during implementation based on actual Claude CLI behavior. The `--print` flag outputs only the response text. The prompt asks for JSON to make parsing reliable.

**Step 2: Commit**

```bash
git add scripts/bio-tool/lib/claude.ts
git commit -m "feat(bio-tool): add Claude CLI integration for italics and content flagging"
```

---

### Task 9: `process-bios.ts` orchestrator

**Files:**
- Create: `scripts/bio-tool/process-bios.ts`

**Step 1: Write the orchestrator**

This is the main processing script. It finds all `bio-update/position-*` branches from the current year and runs each processing step sequentially.

```typescript
import "./lib/env"
import { readFileSync, existsSync, unlinkSync } from "fs"
import { resolve } from "path"
import { load as yamlLoad } from "js-yaml"
import {
  listBioUpdateBranches,
  checkoutBranch,
  checkoutMaster,
  commitFiles,
  commitAll,
} from "./lib/git"
import { getCurrentSeason, seasonYamlPath, imagesDir } from "./lib/season"
import { readSeasonYaml, extractPositionBlock } from "./lib/yaml"
import { hashImage, imagesSimilar, findPreviousImage } from "./lib/image"
import {
  linkInstagramHandles,
  linkBareUrls,
  verifyUrl,
  extractUrls,
} from "./lib/bio-transforms"
import { processBioWithClaude } from "./lib/claude"

async function main() {
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)
  const currentYear = season // Filter branches to current season year

  console.log(`Processing bios for season ${season}\n`)

  // Get all bio-update branches from this year
  const branches = listBioUpdateBranches().filter(
    (b) => b.date.getFullYear() === currentYear,
  )

  if (!branches.length) {
    console.log("No bio-update branches found for the current year.")
    return
  }

  console.log(`Found ${branches.length} branches to process:\n`)

  // Get current season show titles from the YAML (for Claude prompt)
  const showTitles = extractShowTitles(yamlPath)
  console.log(`Current season shows: ${showTitles.join(", ")}\n`)

  for (const { branch, position } of branches) {
    console.log(`\n${"=".repeat(60)}`)
    console.log(`Processing: ${branch}`)
    console.log(`${"=".repeat(60)}`)

    checkoutBranch(branch)

    const yamlContent = readSeasonYaml(yamlPath)
    const block = extractPositionBlock(yamlContent, position)
    if (!block) {
      console.log(`  WARNING: No content found for position ${position}`)
      continue
    }

    // Parse the YAML block to get person details
    const person = parsePerson(block)
    if (!person) {
      console.log(`  WARNING: Could not parse person data`)
      continue
    }

    console.log(`  Person: ${person.firstName} ${person.lastName}`)

    // Step 1: Photo dedup
    await stepPhotoDedup(person, season, yamlPath, yamlContent, position)

    // Step 2: Instagram links
    stepInstagramLinks(person, yamlPath, position)

    // Step 3: URL links
    await stepUrlLinks(person, yamlPath, position)

    // Step 4 & 5: Claude pass (italics + content flag)
    stepClaudePass(person, yamlPath, position, showTitles)
  }

  checkoutMaster()
  console.log(`\n${"=".repeat(60)}`)
  console.log("All branches processed. Review with: git branch --list 'bio-update/*'")
}

// --- Person parsing ---

interface Person {
  firstName: string
  lastName: string
  bio: string
  programBio: string | null
  imageYear: number
  imageFile?: string
}

function parsePerson(yamlBlock: string): Person | null {
  try {
    const parsed = yamlLoad(yamlBlock) as any[]
    if (!parsed?.[0]) return null
    const p = parsed[0]
    return {
      firstName: p.first_name,
      lastName: p.last_name,
      bio: p.bio?.trim() ?? "",
      programBio: p.program_bio?.trim() ?? null,
      imageYear: p.image_year,
      imageFile: p.image_file,
    }
  } catch {
    return null
  }
}

// --- Step implementations ---

async function stepPhotoDedup(
  person: Person,
  season: number,
  yamlPath: string,
  yamlContent: string,
  position: number,
) {
  const kebabName = `${person.firstName}-${person.lastName}`
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")

  // Find the current image
  const imgDir = imagesDir(season)
  const extensions = [".jpg", ".jpeg", ".png", ".webp"]
  let currentImagePath: string | null = null

  for (const ext of extensions) {
    const candidate = resolve(imgDir, `${kebabName}${ext}`)
    if (existsSync(candidate)) {
      currentImagePath = candidate
      break
    }
  }

  if (!currentImagePath) {
    console.log("  Photo dedup: No submitted image found, skipping")
    return
  }

  // Find previous image
  const prev = findPreviousImage(person.firstName, person.lastName, season)
  if (!prev) {
    console.log("  Photo dedup: No previous image found, skipping")
    return
  }

  try {
    const [currentHash, prevHash] = await Promise.all([
      hashImage(currentImagePath),
      hashImage(prev.path),
    ])

    if (imagesSimilar(currentHash, prevHash)) {
      console.log(
        `  Photo dedup: Match found with ${prev.year} image, reusing`,
      )

      // Update image_year in the YAML
      const currentYaml = readSeasonYaml(yamlPath)
      const updated = currentYaml.replace(
        new RegExp(
          `(# start __${position}__[\\s\\S]*?image_year: )\\d+`,
        ),
        `$1${prev.year}`,
      )
      const { writeFileSync } = await import("fs")
      writeFileSync(yamlPath, updated, "utf-8")

      // Remove the duplicate image
      unlinkSync(currentImagePath)

      commitAll(`Reuse existing photo from ${prev.year}`)
    } else {
      console.log("  Photo dedup: Images are different, keeping new one")
    }
  } catch (err) {
    console.log(`  Photo dedup: Error comparing images: ${err}`)
  }
}

function stepInstagramLinks(
  person: Person,
  yamlPath: string,
  position: number,
) {
  let yamlContent = readSeasonYaml(yamlPath)
  const block = extractPositionBlock(yamlContent, position)
  if (!block) return

  const bioResult = linkInstagramHandles(person.bio)
  const progResult = person.programBio
    ? linkInstagramHandles(person.programBio)
    : null

  if (!bioResult && !progResult) {
    console.log("  Instagram: No handles found, skipping")
    return
  }

  if (bioResult) {
    yamlContent = yamlContent.replace(person.bio, bioResult)
  }
  if (progResult && person.programBio) {
    yamlContent = yamlContent.replace(person.programBio, progResult)
  }

  const { writeFileSync } = require("fs")
  writeFileSync(yamlPath, yamlContent, "utf-8")
  commitFiles([yamlPath], "Link Instagram handle")
  console.log("  Instagram: Linked handles")
}

async function stepUrlLinks(
  person: Person,
  yamlPath: string,
  position: number,
) {
  let yamlContent = readSeasonYaml(yamlPath)

  const bioResult = linkBareUrls(person.bio)
  const progResult = person.programBio ? linkBareUrls(person.programBio) : null

  if (!bioResult && !progResult) {
    console.log("  URLs: No bare URLs found, skipping")
    return
  }

  if (bioResult) {
    yamlContent = yamlContent.replace(person.bio, bioResult)
  }
  if (progResult && person.programBio) {
    yamlContent = yamlContent.replace(person.programBio, progResult)
  }

  const { writeFileSync } = require("fs")
  writeFileSync(yamlPath, yamlContent, "utf-8")
  commitFiles([yamlPath], "Link website URLs")

  // Verify all URLs
  const allText = (bioResult ?? person.bio) + (progResult ?? person.programBio ?? "")
  const urls = extractUrls(allText)
  for (const url of urls) {
    const result = await verifyUrl(url)
    const status = result.reachable
      ? `OK (${result.status})`
      : `UNREACHABLE`
    const redirect = result.redirectedTo
      ? ` -> ${result.redirectedTo}`
      : ""
    console.log(`  URL check: ${url} — ${status}${redirect}`)
  }
}

function stepClaudePass(
  person: Person,
  yamlPath: string,
  position: number,
  showTitles: string[],
) {
  console.log("  Claude: Processing bio for italics and content check...")

  const result = processBioWithClaude(person.bio, person.programBio, showTitles)

  // Handle italics fixes
  if (result.italicsFixed) {
    let yamlContent = readSeasonYaml(yamlPath)
    const fixes = result.italicsFixed as any

    if (fixes.bio) {
      yamlContent = yamlContent.replace(person.bio, fixes.bio)
    }
    if (fixes.programBio && person.programBio) {
      yamlContent = yamlContent.replace(person.programBio, fixes.programBio)
    }

    const { writeFileSync } = require("fs")
    writeFileSync(yamlPath, yamlContent, "utf-8")
    const committed = commitFiles([yamlPath], "Fix show title italics")
    if (committed) {
      console.log("  Claude: Committed italics fixes")
    }
  } else {
    console.log("  Claude: No italics fixes needed")
  }

  // Handle content flag
  if (result.contentFlag.flagged) {
    let yamlContent = readSeasonYaml(yamlPath)

    if (result.contentFlag.cleanedText) {
      yamlContent = yamlContent.replace(person.bio, result.contentFlag.cleanedText)
    }

    const { writeFileSync } = require("fs")
    writeFileSync(yamlPath, yamlContent, "utf-8")
    commitFiles(
      [yamlPath],
      "PROPOSED EDIT",
      result.contentFlag.reasoning ?? "Content flagged for review",
    )
    console.log(
      `  Claude: FLAGGED CONTENT — ${result.contentFlag.reasoning}`,
    )
  } else {
    console.log("  Claude: No content concerns")
  }
}

/** Extract show titles from the season YAML (from production_positions and roles keys) */
function extractShowTitles(yamlPath: string): string[] {
  const content = readSeasonYaml(yamlPath)
  const titles = new Set<string>()

  // Match production names under roles: and production_positions:
  const regex = /^\s{4}([A-Z][\w\s'&!?.,:]+):\s*$/gm
  let match
  while ((match = regex.exec(content))) {
    titles.add(match[1].trim())
  }

  return [...titles]
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

**Step 2: Test manually with a single branch**

Run: `pnpm dlx tsx scripts/bio-tool/process-bios.ts`
Expected: Processes each bio-update branch, applying transforms and committing.

**Step 3: Commit**

```bash
git add scripts/bio-tool/process-bios.ts
git commit -m "feat(bio-tool): add main bio processing orchestrator"
```

---

### Task 10: End-to-end manual test

**Step 1: Ensure .env is populated with B2 credentials**

Check: `grep B2_ .env | head -3` — should show non-placeholder values.

**Step 2: Run the full pipeline**

```bash
# Fetch B2 submissions
pnpm dlx tsx scripts/bio-tool/fetch-b2-submissions.ts

# Process all branches
pnpm dlx tsx scripts/bio-tool/process-bios.ts
```

**Step 3: Review results**

```bash
# List all processed branches
git branch --list 'bio-update/*'

# For each branch, review the commit log
git log master..bio-update/position-1 --oneline

# Check a specific branch's changes
git diff master..bio-update/position-1
```

**Step 4: Commit any fixes discovered during testing**

Fix issues as they arise and commit to the appropriate files.

---

### Task 11: Add npm script for convenience

**Files:**
- Modify: `package.json`

**Step 1: Add scripts**

Add to the `"scripts"` section of `package.json`:

```json
"bio:fetch": "tsx scripts/bio-tool/fetch-b2-submissions.ts",
"bio:process": "tsx scripts/bio-tool/process-bios.ts"
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "feat(bio-tool): add convenience npm scripts for bio processing"
```
