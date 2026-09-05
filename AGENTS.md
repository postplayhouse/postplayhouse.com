## Issue Tracking

This project uses **bd (beads)** for issue tracking.
Run `bd prime` for workflow context, or install hooks (`bd hooks install`) for auto-injection.

**Quick reference:**

- `bd ready` - Find unblocked work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd close <id>` - Complete work
- `bd sync` - Sync with git (run at session end)

For full workflow details: `bd prime`

## Historical Images

Orb setup restores the verified historical-image artifacts automatically. Use
`pnpm build` for ordinary production builds or `pnpm build:low-memory` in a
memory-constrained orb; both restore historical images before invoking Vite.

Do not invoke `pnpm build:vite` directly unless you have already run
`pnpm images:historical:restore`. It is an internal post-restore entry point: it
does not download or regenerate historical images, and bypassing the restore can
cause missing-asset failures followed by an expensive recovery or regeneration.
