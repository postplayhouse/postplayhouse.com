# Orb Setup and Build Memory Design

**Date:** 2026-08-30

## Scope

Add an Amp orb setup path for this SvelteKit repository and reduce only measured
memory pressure in its image build/cache workflows.

## Setup

`.agents/setup` will be a small, non-interactive Bash script that:

1. prints memory and disk measurements when the host exposes them;
2. verifies the exact Node and pnpm versions pinned by `.tool-versions` and
   `package.json`;
3. runs `pnpm install --frozen-lockfile`;
4. installs Playwright Chromium only when the pinned browser executable is not
   already present; and
5. prints final resource measurements.

The script will not install system packages, invoke `sudo`, probe Docker, copy an
environment template, start services, build the application, or fetch optional
branch-only cache data. Those actions are either unnecessary for ordinary work,
privilege-sensitive, secret-sensitive, or too expensive for setup.

## Regression Harness

An executable shell harness will run setup in a temporary fixture with stubbed
Node, pnpm, and Playwright commands. It will prove that setup:

- succeeds without optional branch files or service definitions;
- never invokes `sudo` or Docker when both are unavailable;
- installs locked dependencies;
- skips Chromium installation when its executable exists; and
- installs Chromium when the executable is absent.

The harness invokes no real package installation, browser download, Docker
command, or privileged command.

## E2E Prerequisites

The current Playwright configuration starts the SvelteKit build and preview
server directly. Docker is not a prerequisite and setup must not add a false
Docker gate. Repository documentation will state the actual Chromium
prerequisite and note that Docker verification belongs only with a future test
suite that actually depends on Docker.

## Memory Hardening

Profile `pnpm build` and the enhanced-image B2 cache tests with peak RSS, elapsed
time, and before/after disk usage. Change only a demonstrated hotspot. The likely
candidate is temporary cache publication, which currently copies and then
extracts the complete imagetools cache, but this remains a hypothesis until
profiling confirms it. Setup itself will never build or restore/publish the B2
cache, keeping fresh-orb memory and disk use bounded.

## Verification

Run the harness, setup twice, focused cache tests, type checks, and a measured
build. Verify executable file modes and a clean non-interactive login shell.
Record commands, peak RSS, disk measurements, and residual orb risks.
