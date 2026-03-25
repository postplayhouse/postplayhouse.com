# Bio Merge & Cleanup Scripts Design

## Problem

After processing bio branches, merging them to master is manual: reviewing commits, squashing, cherry-picking. Cleaning up stale branches is also tedious.

## Script 1: `bio:merge` — Interactive squash-to-master

**`scripts/bio-tool/merge-bios.ts`**

1. Fetch remote bio-update branches, list current-year branches with person names
2. Interactive checkbox: select branches to process
3. For each selected branch:
   - List all commits ahead of master
   - Interactive checkbox: all selected by default, deselect to drop
   - Cherry-pick the kept commits onto a temp branch from master, squash into one commit
   - Commit message: original title (first commit's message) + body listing kept adjustment commits
   - Fast-forward master to the squashed commit
   - **Branch stays untouched** — user deletes manually or via cleanup script
4. At the end, user is on master with the new squashed commits

### Example commit message

```
Bio 5: Dewayne Barrett

Includes:
- Fix show title italics
```

## Script 2: `bio:cleanup` — Interactive branch deletion

**`scripts/bio-tool/cleanup-branches.ts`**

1. List all `bio-update/position-*` branches (local + remote)
2. For each, check `git diff master..branch -- src/data/people/` — if empty, mark as "merged"
3. Interactive checkbox: merged branches pre-selected, unmerged listed but not pre-selected
4. Delete selected branches locally and on remote

## Dependency

`@inquirer/prompts` for interactive checkbox UI.

## npm scripts

```json
"bio:merge": "tsx scripts/bio-tool/merge-bios.ts",
"bio:cleanup": "tsx scripts/bio-tool/cleanup-branches.ts"
```
