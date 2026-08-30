# Orb Setup and Build Memory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide a minimal idempotent Amp orb setup and keep measured SvelteKit image build/cache memory and disk use safe for a roughly 3.8 GiB, no-swap orb.

**Architecture:** `.agents/setup` owns only pinned tool verification, locked dependency installation, conditional Playwright Chromium installation, and resource reporting. An isolated executable shell harness tests setup through command stubs. Build/cache changes are made only after peak-RSS and disk profiling identifies a concrete hotspot.

**Tech Stack:** Bash, Node.js 24.10.0, pnpm 10.24.0, Playwright, SvelteKit/Vite, Vitest, Sharp, tar.

---

### Task 1: Capture baseline failures and resource evidence

**Files:**

- Read: `.tool-versions`
- Read: `package.json`
- Read: `playwright.config.ts`
- Read: `scripts/enhanced-image-cache/cache.ts` on `origin/feat/b2-enhanced-image-cache`

**Step 1:** Run the absent setup path and record exit 127.

**Step 2:** Verify noninteractive sudo and Docker are unavailable without starting either service.

**Step 3:** Record current source, dependency, generated-output, and image-cache disk use.

**Step 4:** Run `/usr/bin/time -lp pnpm build` and focused B2 cache tests, recording peak RSS and elapsed time.

### Task 2: Add a failing setup regression harness

**Files:**

- Create: `.agents/test-setup`

**Step 1:** Build a temporary repository fixture with copied setup inputs and stubbed `node`, `pnpm`, `docker`, and `sudo` commands.

**Step 2:** Assert setup succeeds without optional files, uses `pnpm install --frozen-lockfile`, never invokes Docker/sudo, skips an existing Chromium executable, and installs an absent Chromium executable.

**Step 3:** Run `.agents/test-setup` and confirm it fails because `.agents/setup` does not exist.

### Task 3: Implement minimal setup

**Files:**

- Create: `.agents/setup`

**Step 1:** Add strict Bash mode, repository-root resolution, and optional Linux/macOS resource reporting.

**Step 2:** Read exact Node/pnpm pins from existing source-of-truth files and fail with actionable mismatch messages.

**Step 3:** Run `pnpm install --frozen-lockfile`.

**Step 4:** Use Playwright's executable-path API to install Chromium only when absent.

**Step 5:** Mark setup and harness executable, run the harness, and confirm it passes.

### Task 4: Document actual E2E prerequisites

**Files:**

- Modify: `README.md`

**Step 1:** Document `pnpm test:integration`, Chromium installation, and that current E2E uses the local SvelteKit build/preview server without Docker.

**Step 2:** Run formatting checks on changed documentation.

### Task 5: Harden measured memory hotspots

**Files:**

- Modify only the measured hotspot under `scripts/enhanced-image-cache/`
- Test: `scripts/enhanced-image-cache/cache.test.ts`

**Step 1:** Add a failing focused test for the measured high-copy behavior.

**Step 2:** Implement the smallest streaming or copy-elimination change that preserves archive validation and atomic installation.

**Step 3:** Run focused tests and re-profile peak RSS/disk.

**Step 4:** If profiling does not demonstrate a code hotspot, make no speculative cache change and record that result.

### Task 6: Verify idempotence and repository health

**Files:**

- Verify: `.agents/setup`
- Verify: `.agents/test-setup`
- Verify: `README.md`

**Step 1:** Run the harness.

**Step 2:** Run setup twice and compare warm behavior/timing.

**Step 3:** Run focused tests, `pnpm check`, and a measured production build.

**Step 4:** Verify setup from a clean non-interactive login shell.

**Step 5:** Inspect the diff, executable modes, git status, peak memory, generated disk, and remaining risks before committing.
