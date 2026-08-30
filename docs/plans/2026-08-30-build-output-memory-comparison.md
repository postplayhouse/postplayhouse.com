# Build Output and Memory Comparison Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve complete build output while measuring and reducing peak and sustained memory pressure independently from cache and bundler effects.

**Architecture:** Use clean worktrees with identical source inputs and an external sampler to record process-tree RSS over time. Generate normalized artifact manifests after each build, compare legacy and low-memory settings first, then evaluate the latest compatible SvelteKit/Vite stack in a separate worktree so dependency and bundler effects remain isolated.

**Tech Stack:** SvelteKit, Vite, Rollup/Rolldown, pnpm, POSIX shell, macOS `ps`, Node.js.

---

### Task 1: Establish reproducible build evidence

**Files:**

- Create: `scripts/profile-build.mjs`
- Create: `scripts/build-artifact-manifest.mjs`

1. Add process-tree RSS sampling with timestamped CSV output and final peak/high-pressure summaries.
2. Add an artifact manifest containing relative path, byte size, and SHA-256 digest.
3. Run both tools against a small command/fixture and verify their reports.
4. Commit the measurement tooling separately from production configuration.

### Task 2: Explain the existing output-size difference

**Files:**

- Inspect: `vite.config.ts`
- Inspect: `src/routes/(app)/program-bios/+page.svelte`
- Inspect: `src/routes/(app)/media/downloadMediaImagesVitePlugin.ts`

1. Create clean worktrees for `origin/master` and the current local branch.
2. Run uncached builds with matching source-map settings and capture profiles/manifests.
3. Compare path sets, file counts, category totals, and digests.
4. Test source-map state and the program-bios image scope as separate variables.
5. Record the confirmed cause; do not change behavior until equivalence is demonstrated.

### Task 3: Restore equivalent output if needed

**Files:**

- Modify only the source file proven to omit required artifacts.
- Test: artifact-manifest comparison from Task 2.

1. Create a failing artifact-equivalence check for any confirmed omission.
2. Make the smallest correction that restores required output.
3. Repeat clean profiling and artifact comparison.
4. Commit the correction independently.

### Task 4: Evaluate the latest compatible build stack

**Files:**

- Modify in isolated comparison worktree: `package.json`, `pnpm-lock.yaml`

1. Record installed and registry-latest SvelteKit, Svelte, Vite, adapters, and enhanced-image versions.
2. Upgrade only the compatible Svelte build stack in the isolated worktree with a frozen resulting lockfile.
3. Verify from build output/package metadata whether Vite uses Rolldown.
4. Run a clean uncached build with matching output settings and capture the same profile/manifest.
5. Compare peak RSS, time above pressure thresholds, wall time, diagnostics, tests, and output equivalence.
6. Retain the upgrade only if correctness and output equivalence hold and the tradeoff is suitable for the orb.

### Task 5: Final verification and reporting

**Files:**

- Update: `docs/plans/2026-08-30-orb-setup-memory-design.md` if measured guidance changes.

1. Run setup harness, unit tests, Svelte checks, final clean build, and Playwright.
2. Confirm no listeners or nonessential build/browser processes remain.
3. Record the complete clean comparison matrix and remaining limitations in the Post Playhouse ledger.
4. Report back to the requesting Puck thread without pushing, merging, deploying, or shipping.
