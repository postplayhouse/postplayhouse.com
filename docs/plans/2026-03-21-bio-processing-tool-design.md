# Bio Processing Tool Design

## Problem

Bio submissions arrive via two paths: GitHub PRs (`bio-update/position-*` branches) and Backblaze B2 fallback uploads. Processing each bio manually — adding italics to show titles, linking social handles, deduplicating photos, and checking content — is tedious and error-prone.

## Solution

A two-script pipeline that normalizes all submissions into local branches, then processes each branch through a series of automated steps with discrete commits.

## Flow

```
B2 submissions ──► fetch-b2-submissions.ts ──► bio-update/position-* branches
                                                        │
Existing PRs (current year only) ───────────────────────┤
                                                        ▼
                                              process-bios.ts
                                                        │
                                    ┌───────────────────┤
                                    ▼                   ▼
                              Non-Claude steps    Claude single pass
                              (commits 2-4)       (commits 5-6)
                                    │                   │
                                    ▼                   ▼
                              Local branches ready for review
```

## Script 1: fetch-b2-submissions.ts

1. Authenticate with B2 using env vars (`B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_ID`)
2. List all files in the bucket
3. Determine current season from the latest `src/data/people/*.yml` filename
4. For each `.txt` bio submission:
   - Parse metadata (position, name, email) and YAML bio content from the file
   - Extract timestamp from the filename (or B2 upload date)
   - Run `git blame` on the `# start __${position}__` block in `{season}.yml` to get last-updated timestamp
   - **Skip** if blame timestamp is newer than B2 file timestamp
   - Otherwise: create branch `bio-update/position-${position}` off master, replace the YAML block between `# start __${position}__` and `# end __${position}__`, commit as "Bio submission from {First Last}"
5. For each matching image file in B2:
   - Download and place in `src/images/people/{season}/{first-last}.{ext}` (kebab-case)
   - Include in the same initial commit

## Script 2: process-bios.ts

Finds all `bio-update/position-*` branches, filters to current year only (by initial commit date), and processes each sequentially.

### Per-branch pipeline

Each step produces a commit only if changes are needed.

#### Step 1: Raw submission (already present)
The initial commit on the branch.

#### Step 2: Photo dedup (no Claude)
- Check if person (by name) exists in prior season YAMLs
- If so, compute perceptual hash of submitted image and previous image
- Use a loose similarity threshold (biased toward matching — easy to revert a bad match)
- If match: update `image_year` to reference the existing photo, remove duplicate image file
- Commit: `"Reuse existing photo from {year}"`

#### Step 3: Instagram links (no Claude)
- Regex scan `bio:` and `program_bio:` for `@handle`, `Instagram: handle`, `IG: @handle`, etc.
- Convert to `[@handle](https://www.instagram.com/handle)`
- Commit: `"Link Instagram handle"`

#### Step 4: URL links + verification (no Claude)
- Regex scan for bare URLs not already in markdown link syntax
- Convert to `[domain](https://url)`
- `curl` each URL and report status to stdout (does not fail on broken links)
- Commit: `"Link website URLs"`

#### Step 5: Claude pass — italics (Claude CLI)
- Extract `bio:` and `program_bio:` text
- Single `claude` CLI invocation with prompt covering:
  - **Italics:** Identify show titles (current season shows + general theatre knowledge + contextual clues) missing `*Title*` markdown italics
  - **Content flagging:** Flag anything potentially inappropriate for a conservative/children's theatre audience
- If italics fixes needed:
  - Commit: `"Fix show title italics"`

#### Step 6: Claude pass — content flag
- From the same Claude response as step 5
- If content flagged:
  - Commit: `"PROPOSED EDIT"` with reasoning in the commit body explaining what was flagged and why

## File Structure

```
scripts/bio-tool/
  fetch-b2-submissions.ts   — B2 download + branch creation
  process-bios.ts           — orchestrator, runs steps on each branch
  lib/
    b2.ts                   — B2 API auth, list files, download
    git.ts                  — branch ops, blame timestamps, commits
    yaml.ts                 — parse/replace position blocks in season YAML
    image.ts                — perceptual hash, similarity comparison
    bio-transforms.ts       — instagram links, URL links, curl verification
    claude.ts               — claude CLI invocation, response parsing
    season.ts               — determine current season from data files
```

## Dependencies

- `imghash` or similar perceptual hash library
- Node built-ins (`child_process`, `fs`, `path`)
- Project env vars for B2 auth
- `claude` CLI installed locally
- `pnpm dlx tsx` to run TypeScript scripts

## Key Decisions

- **B2 skip logic:** Compare B2 file timestamp against `git blame` timestamp for the position block. Newer B2 file = needs processing. Handles re-submissions correctly.
- **Current year filter:** Only process branches whose initial commit is from the current season year. Stale branches from prior seasons are ignored.
- **Loose photo matching threshold:** Bias toward matching since images may be heavily compressed/resized with JPEGmini. Bad matches are easy to revert (just drop the commit).
- **Claude single pass:** One CLI call handles both italics and content flagging, but results are split into separate commits for clean git history.
- **URL verification is non-blocking:** curl results are reported to stdout but don't prevent commits.
