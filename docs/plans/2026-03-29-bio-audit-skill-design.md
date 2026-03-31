# Bio Audit Skill Design

## Problem

After all bio processing and merging is complete, we need to verify that every submission (remote branches and B2 uploads) is properly represented on master before telling coworkers everything is up to date. Currently this requires manual cross-referencing.

## Solution

Two new scripts and a Claude Code skill that orchestrates them into a final audit.

## Scripts

### `bio:audit-master`

For every position block in the current season's YAML, output the position number, person's name, and newest git blame timestamp across all lines in that block.

**Output:** JSON array to stdout.

```json
[
  { "position": 1, "name": "Em Laudeman", "newestBlame": "2026-03-15T04:22:00.000Z" }
]
```

**Implementation:** Iterate over all `# start __N__` / `# end __N__` markers in the YAML, extract the person's name via YAML parsing, call `getPositionBlameTimestamp` for each.

### `bio:audit-b2`

List all B2 submissions and images for the current season. Downloads `.txt` files to `scripts/bio-tool/b2-cache.ignore/` on first run, reuses cache afterward.

**How it works:**

1. Call `listFiles()` from existing B2 lib
2. Filter to files uploaded since the season cutoff (September 1st of prior year)
3. For each `.txt` file: check if already in `b2-cache.ignore/`; if not, download it
4. Parse each cached file's metadata to extract `bio position: N` and person's name
5. Match image files to bio submissions by shared basename
6. Report unmatched images separately (images with no accompanying `.txt`)

**Output:** JSON object to stdout.

```json
{
  "submissions": [
    {
      "position": 42,
      "name": "Scott Lee Clayton",
      "b2Timestamp": "2026-02-20T18:30:00.000Z",
      "fileName": "1740077400000-scott-lee-clayton.txt",
      "imageFile": "1740077400000-scott-lee-clayton.jpg",
      "imageTimestamp": "2026-02-20T18:30:05.000Z"
    }
  ],
  "unmatchedImages": [
    {
      "fileName": "1740099000000-jane-doe.png",
      "uploadTimestamp": "2026-02-21T10:00:00.000Z",
      "parsedName": "Jane Doe"
    }
  ]
}
```

**Flags:** `--refresh` to re-download everything (ignore cache).

## Skill: `bio-audit`

**When to use:** After all bio work is done for a season, when the user believes master is fully up to date and wants verification before communicating that to coworkers.

**What the agent does:**

1. Run `pnpm bio:audit-master` — capture master blame timestamps for all positions
2. Run `pnpm bio:audit-b2` — capture all B2 submissions and images for the season
3. Run `git branch -r --list "origin/bio-update/*"` — list remaining remote branches
4. For each remote branch: get its latest commit timestamp and compare against master's blame for that position. Flag if the branch is newer.
5. For each B2 submission: compare its `b2Timestamp` against master's blame for that position. Flag if the submission is newer.
6. For each B2 submission with an image: verify the person's position block on master has `image_year` matching the current season, or that the image was deduped to a prior year. Flag if neither.
7. For unmatched images (no `.txt`): cross-reference against master's YAML by parsed name, check `image_year`. Flag if not accounted for.
8. Report findings grouped by source (remote branch / B2 submission / unmatched image).
9. For anything flagged, suggest possible reasons the scripts might have missed it and offer to investigate.
10. **Do not take corrective action.** Report only.

**When NOT to flag:** If master's blame timestamp is newer than or equal to the source timestamp, that position is accounted for.
