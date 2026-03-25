# Bio Processing Tool

Automates processing of bio submissions from Backblaze B2 and GitHub PRs for the Post Playhouse website.

## Prerequisites

- Node.js and pnpm
- `claude` CLI installed locally (for italics/content flagging)
- `.env` file at project root with B2 credentials:
  ```
  B2_APPLICATION_KEY_ID=...
  B2_APPLICATION_KEY=...
  B2_BUCKET_ID=...
  ```
- A `GITHUB_TOKEN` environment variable (for PR-based email collection)

## Workflow

The typical season workflow runs these commands in order:

### 1. Fetch submissions

```sh
pnpm bio:fetch
```

Downloads bio submissions from B2, creates `bio-update/position-*` branches off master. Also fetches any existing PR branches. Skips submissions where the YAML position block is already newer (via `git blame` timestamp).

### 2. Process bios

```sh
pnpm bio:process
```

Iterates all `bio-update/position-*` branches (current season only) and runs these transforms as discrete commits on each branch:

1. CRLF normalization
2. Image optimization (resize, orient, convert to .jpg)
3. Photo dedup via perceptual hashing (reuses prior-year photos if similar)
4. Instagram handle linking (`@handle` -> markdown link)
5. Bare URL linking
6. Capitalization fixes (ALL CAPS -> Title Case)
7. State abbreviation normalization
8. Claude CLI pass: show title italics + content flagging

Use `--no-suggest-edits` to skip the content flagging commit.

### 3. Review

```sh
pnpm bio:review
```

Builds a consolidated review branch that splices all processed bio position blocks into a single branch for easy diffing against master.

### 4. Collect emails

```sh
pnpm bio:emails
```

Collects submitter email addresses from B2 metadata and GitHub PR authors. Stores them in a local manifest file for use during merge notifications.

### 5. Merge to master

```sh
pnpm bio:merge
```

Interactive UI to select branches, squash-merge each to master with a normalized commit message (`Bio N: Person Name`). Runs a link check after merging and requires the email manifest to exist.

### 6. Check links

```sh
pnpm bio:links
```

Checks all URLs found in the current season's YAML file. Reports broken links.

### Optimize a single image

```sh
pnpm bio:optimize path/to/image.jpg
```

Auto-orients, resizes to max 1200px, converts to JPEG (mozjpeg quality 82), and overwrites in place. Non-JPEG files are converted and the original deleted.

### 7. Clean up branches

```sh
pnpm bio:cleanup
```

Interactive UI to delete merged `bio-update/*` branches (local and remote). Branches with no diff against master in `src/data/people/` are pre-selected as merged.

## Architecture

See [design doc](../../docs/plans/2026-03-21-bio-processing-tool-design.md) for the full architecture and decisions.

```
scripts/bio-tool/
  fetch-b2-submissions.ts   — B2 download + branch creation
  process-bios.ts           — orchestrator, runs all transforms
  review-bios.ts            — consolidated review branch builder
  merge-bios.ts             — interactive squash-merge to master
  collect-emails.ts         — email collection from B2 + PRs
  check-links.ts            — URL verification
  cleanup-branches.ts       — branch deletion
  optimize-image.ts         — standalone image optimization
  lib/
    b2.ts                   — B2 API client
    bio-transforms.ts       — Instagram/URL linking, URL verification
    claude.ts               — Claude CLI integration
    env.ts                  — dotenv loader
    git.ts                  — git operations
    image.ts                — perceptual hashing, image comparison
    manifest.ts             — email manifest persistence
    season.ts               — current season detection
    yaml.ts                 — YAML position block parsing/replacement
```
