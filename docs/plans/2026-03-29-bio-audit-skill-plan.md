# Bio Audit Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create two audit scripts and a Claude Code skill that together verify all bio submissions (remote branches + B2) are represented on master.

**Architecture:** `bio:audit-master` reads blame timestamps for all positions in the season YAML. `bio:audit-b2` lists B2 submissions/images with a local cache. A skill in `~/.claude/skills/bio-audit/` tells a Claude agent how to run both scripts, check remote branches, and cross-reference everything.

**Tech Stack:** TypeScript (tsx), existing bio-tool libs (git, b2, season, yaml), vitest for tests.

---

### Task 1: Create `audit-master.ts` — extract all positions and blame timestamps

**Files:**
- Create: `scripts/bio-tool/audit-master.ts`

**Step 1: Write the script**

This script iterates over all `# start __N__` markers in the current season YAML, parses the person's name from each block, calls `getPositionBlameTimestamp`, and outputs JSON.

```typescript
import { load as yamlLoad } from "js-yaml"
import { getCurrentSeason, seasonYamlPath } from "./lib/season"
import { readSeasonYaml, extractPositionBlock } from "./lib/yaml"
import { getPositionBlameTimestamp } from "./lib/git"

interface PersonData {
  first_name: string
  last_name: string
  image_year?: number
  [key: string]: unknown
}

function getAllPositions(yamlContent: string): number[] {
  const positions: number[] = []
  const regex = /# start __(\d+)__/g
  let match
  while ((match = regex.exec(yamlContent)) !== null) {
    positions.push(parseInt(match[1]))
  }
  return positions.sort((a, b) => a - b)
}

function getPersonFromBlock(block: string): { name: string; imageYear: number | null } | null {
  try {
    const parsed = yamlLoad(block) as PersonData[]
    if (parsed?.[0]) {
      return {
        name: `${parsed[0].first_name} ${parsed[0].last_name}`,
        imageYear: parsed[0].image_year ?? null,
      }
    }
  } catch { /* skip */ }
  return null
}

function main() {
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)
  const yamlContent = readSeasonYaml(yamlPath)
  const positions = getAllPositions(yamlContent)

  const results = positions.map((position) => {
    const block = extractPositionBlock(yamlContent, position)
    const person = block ? getPersonFromBlock(block) : null
    const blameDate = getPositionBlameTimestamp(yamlPath, position, "master")

    return {
      position,
      name: person?.name ?? `Position ${position}`,
      imageYear: person?.imageYear ?? null,
      newestBlame: blameDate?.toISOString() ?? null,
    }
  })

  console.log(JSON.stringify(results, null, 2))
}

main()
```

**Step 2: Add script to package.json**

Add to the `scripts` section:
```json
"bio:audit-master": "tsx scripts/bio-tool/audit-master.ts"
```

**Step 3: Run and verify output**

Run: `pnpm bio:audit-master`
Expected: JSON array with position entries, each having `position`, `name`, `imageYear`, and `newestBlame` fields.

**Step 4: Commit**

```bash
git add scripts/bio-tool/audit-master.ts package.json
git commit -m "Add bio:audit-master script"
```

---

### Task 2: Create `audit-b2.ts` — list B2 submissions and images with caching

**Files:**
- Create: `scripts/bio-tool/audit-b2.ts`

**Step 1: Write the script**

This script lists all B2 files for the current season, downloads `.txt` files to a cache directory, parses positions from their metadata, matches images to submissions, and reports unmatched images.

```typescript
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
```

**Step 2: Add script to package.json**

Add to the `scripts` section:
```json
"bio:audit-b2": "tsx scripts/bio-tool/audit-b2.ts"
```

**Step 3: Run and verify output**

Run: `pnpm bio:audit-b2`
Expected: JSON object with `submissions` array and `unmatchedImages` array.

**Step 4: Commit**

```bash
git add scripts/bio-tool/audit-b2.ts package.json
git commit -m "Add bio:audit-b2 script"
```

---

### Task 3: Create the `bio-audit` skill

**Files:**
- Create: `~/.claude/skills/bio-audit/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: bio-audit
description: Use when the user wants to verify all bio submissions are represented on master, before communicating that bios are up to date or deleting remote branches. Triggers on phrases like "audit bios", "check bios are complete", "verify all bios merged".
---

# Bio Audit

## Overview

Verify that every bio submission source (remote git branches and B2 uploads) is accounted for on master. This is a read-only audit — report findings but do not take corrective action.

## When to Use

- After all bio processing and merging is complete
- Before telling coworkers that all bios are up to date
- Before cleaning up remote branches

## Audit Process

### Step 1: Gather master state

Run in the postplayhouse.com repo:

\`\`\`bash
pnpm bio:audit-master
\`\`\`

This outputs JSON with every position's `name`, `imageYear`, and `newestBlame` timestamp on master. Save this output — you'll cross-reference everything against it.

### Step 2: Gather B2 submissions

\`\`\`bash
pnpm bio:audit-b2
\`\`\`

This outputs JSON with `submissions` (each with `position`, `name`, `b2Timestamp`, `imageFile`, `imageTimestamp`) and `unmatchedImages`. Save this output.

If B2 credentials aren't configured, tell the user and skip to Step 3.

### Step 3: Check remote branches

\`\`\`bash
git fetch origin 'refs/heads/bio-update/*:refs/remotes/origin/bio-update/*'
git branch -r --list "origin/bio-update/position-*" --format="%(refname:short)"
\`\`\`

For each remote branch, get its latest commit timestamp:

\`\`\`bash
git log -1 --format=%cI origin/bio-update/position-N
\`\`\`

### Step 4: Cross-reference

For each source, compare against master's blame timestamp for that position:

**Remote branches:**
- Extract position number from branch name
- Compare branch's commit timestamp against master's `newestBlame` for that position
- **Flag if:** branch timestamp is newer than master's blame (content not yet on master)
- **OK if:** master's blame is newer than or equal to branch timestamp

**B2 submissions:**
- Compare `b2Timestamp` against master's `newestBlame` for that position
- **Flag if:** B2 timestamp is newer than master's blame
- **OK if:** master's blame is newer than or equal to B2 timestamp

**B2 images (matched to submissions):**
- Check that the person's `imageYear` on master equals the current season, OR that the person existed in a prior season (image may have been deduped to a prior year's photo)
- **Flag if:** `imageYear` doesn't match current season and no prior image exists for that person

**Unmatched images (no .txt file):**
- Use the parsed name from the image filename
- Find that person in master's YAML by name
- Check `imageYear` as above
- **Flag if:** person not found in master, or `imageYear` doesn't account for the image

### Step 5: Report

Group findings into:

1. **All clear** — positions where all sources are accounted for (brief summary, don't list each one)
2. **Flagged — remote branches** — branches newer than master
3. **Flagged — B2 submissions** — submissions newer than master
4. **Flagged — images** — images not accounted for on master
5. **Unmatched images** — images with no bio submission that aren't on master

For each flagged item, include:
- The position, person name, and source timestamp
- Master's blame timestamp for comparison
- A suggestion of what might have gone wrong (e.g., "This branch may have been skipped by bio:merge due to a cherry-pick conflict", "This B2 submission may have arrived after the last bio:fetch run")

### Step 6: Offer to investigate

If anything is flagged, offer to look into why the scripts might have missed it. Do NOT take corrective action — just investigate and explain.

## Do NOT

- Run bio:fetch, bio:process, bio:merge, or bio:cleanup
- Create or delete branches
- Modify any files
- Push to remote
```

**Step 2: Verify skill directory exists and is correct**

```bash
ls ~/.claude/skills/bio-audit/SKILL.md
```

**Step 3: Commit the skill (no repo commit needed — it's in ~/.claude)**

The skill lives outside the repo. No git commit.

---

### Task 4: Test the full workflow manually

**Step 1: Run `bio:audit-master` and check output is valid JSON with all positions**

```bash
pnpm bio:audit-master | head -20
```

**Step 2: Run `bio:audit-b2` and check output is valid JSON with submissions and images**

```bash
pnpm bio:audit-b2 | head -30
```

**Step 3: Verify the cache directory was created**

```bash
ls scripts/bio-tool/b2-cache.ignore/
```

**Step 4: Verify the skill is discoverable**

Start a new Claude Code session and ask it to audit bios. It should find and invoke the `bio-audit` skill.
