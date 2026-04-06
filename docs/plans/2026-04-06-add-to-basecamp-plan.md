# Add People to Basecamp Projects — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** A script that reads `src/data/people/2026.yml`, filters people into two lists (Virtual Call Board 2026 / Production Staff 2026), matches them against existing Basecamp account members by name, and adds them — granting existing accounts and inviting new ones by email — after a dry-run confirmation step.

**Architecture:** Single `tsx` script at `scripts/bio-tool/add-to-basecamp.ts`, following the existing bio-tool pattern. Pure filtering/matching logic extracted into `scripts/bio-tool/lib/basecamp-people.ts` so it can be unit-tested. API calls are plain `fetch` with a bearer token, matching the style already used in `src/routes/api/basecamp.server.ts`.

**Tech Stack:** TypeScript, `tsx`, `js-yaml` (already a dep), `vitest` (test runner), existing `lib/env.ts`, `lib/manifest.ts`, `lib/season.ts`.

---

## Task 1: Add `BASECAMP_TOKEN` to env files

**Files:**
- Modify: `.env.example`
- Modify: `.env`

**Step 1:** Add a new line to `.env.example` after `BASECAMP_BIO_BOT_INTEGRATION_KEY`:

```
BASECAMP_TOKEN=your_oauth_access_token_here
```

**Step 2:** Obtain your OAuth access token from `https://launchpad.37signals.com/integrations` and add the real value to `.env`:

```
BASECAMP_TOKEN=<your actual token>
```

**Step 3:** Commit `.env.example` only (`.env` is gitignored):

```bash
git add .env.example
git commit -m "feat: add BASECAMP_TOKEN env var for people management API"
```

---

## Task 2: Add `bio:basecamp` script to `package.json`

**Files:**
- Modify: `package.json`

**Step 1:** Add the script entry alongside the other `bio:*` commands:

```json
"bio:basecamp": "tsx scripts/bio-tool/add-to-basecamp.ts"
```

**Step 2:** Commit:

```bash
git add package.json
git commit -m "feat: add bio:basecamp npm script"
```

---

## Task 3: Create `lib/basecamp-people.ts` with filtering and matching logic

This is the pure, testable core. No API calls here.

**Files:**
- Create: `scripts/bio-tool/lib/basecamp-people.ts`
- Create: `scripts/bio-tool/lib/basecamp-people.test.ts`

**Step 1: Write the failing tests** in `scripts/bio-tool/lib/basecamp-people.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import {
  isOnlyBoardMember,
  hasStaffPositions,
  fullName,
  partitionPeople,
} from "./basecamp-people"

describe("isOnlyBoardMember", () => {
  it("returns true when groups is only board", () => {
    expect(isOnlyBoardMember({ groups: ["board"] })).toBe(true)
  })

  it("returns false when groups includes staff alongside board", () => {
    expect(isOnlyBoardMember({ groups: ["board", "staff"] })).toBe(false)
  })

  it("returns false when groups is absent", () => {
    expect(isOnlyBoardMember({})).toBe(false)
  })

  it("returns false when groups includes non-board", () => {
    expect(isOnlyBoardMember({ groups: ["staff"] })).toBe(false)
  })
})

describe("hasStaffPositions", () => {
  it("returns true when staff_positions is a non-empty array", () => {
    expect(hasStaffPositions({ staff_positions: ["Artistic Director"] })).toBe(true)
  })

  it("returns false when staff_positions is absent", () => {
    expect(hasStaffPositions({})).toBe(false)
  })

  it("returns false when staff_positions is empty", () => {
    expect(hasStaffPositions({ staff_positions: [] })).toBe(false)
  })
})

describe("fullName", () => {
  it("combines first and last name", () => {
    expect(fullName({ first_name: "Don", last_name: "Denton" })).toBe("Don Denton")
  })
})

describe("partitionPeople", () => {
  const basecampPeople = [
    { id: 1, name: "Alice Smith" },
    { id: 2, name: "Bob Jones" },
  ]
  const emailManifest = new Map([
    ["Carol White", "carol@example.com"],
    ["Dave Brown", "dave@example.com"],
  ])

  it("grants access to people already in Basecamp", () => {
    const people = [{ first_name: "Alice", last_name: "Smith" }]
    const result = partitionPeople(people, basecampPeople, emailManifest)
    expect(result.grant).toEqual([1])
    expect(result.create).toHaveLength(0)
    expect(result.skip).toHaveLength(0)
  })

  it("creates invitations for people with an email but no Basecamp account", () => {
    const people = [{ first_name: "Carol", last_name: "White" }]
    const result = partitionPeople(people, basecampPeople, emailManifest)
    expect(result.create).toEqual([{ name: "Carol White", email_address: "carol@example.com" }])
    expect(result.grant).toHaveLength(0)
    expect(result.skip).toHaveLength(0)
  })

  it("skips people with no Basecamp account and no email", () => {
    const people = [{ first_name: "Unknown", last_name: "Person" }]
    const result = partitionPeople(people, basecampPeople, emailManifest)
    expect(result.skip).toEqual(["Unknown Person"])
    expect(result.grant).toHaveLength(0)
    expect(result.create).toHaveLength(0)
  })
})
```

**Step 2:** Run tests to confirm they fail:

```bash
pnpm test:unit --run scripts/bio-tool/lib/basecamp-people.test.ts
```

Expected: errors like `Cannot find module './basecamp-people'`.

**Step 3:** Create `scripts/bio-tool/lib/basecamp-people.ts`:

```typescript
export interface YamlPerson {
  first_name: string
  last_name: string
  groups?: string[]
  staff_positions?: string[]
  [key: string]: unknown
}

export interface BasecampPerson {
  id: number
  name: string
}

export interface CreateEntry {
  name: string
  email_address: string
}

export interface Partition {
  grant: number[]
  create: CreateEntry[]
  skip: string[]
}

export function isOnlyBoardMember(person: Partial<YamlPerson>): boolean {
  const groups = person.groups ?? []
  return groups.length > 0 && groups.every((g) => g === "board")
}

export function hasStaffPositions(person: Partial<YamlPerson>): boolean {
  return Array.isArray(person.staff_positions) && person.staff_positions.length > 0
}

export function fullName(person: Pick<YamlPerson, "first_name" | "last_name">): string {
  return `${person.first_name} ${person.last_name}`
}

export function partitionPeople(
  people: YamlPerson[],
  basecampPeople: BasecampPerson[],
  emailManifest: Map<string, string>,
): Partition {
  const basecampByName = new Map(basecampPeople.map((p) => [p.name, p.id]))
  const grant: number[] = []
  const create: CreateEntry[] = []
  const skip: string[] = []

  for (const person of people) {
    const name = fullName(person)
    const basecampId = basecampByName.get(name)
    if (basecampId !== undefined) {
      grant.push(basecampId)
    } else {
      const email = emailManifest.get(name)
      if (email) {
        create.push({ name, email_address: email })
      } else {
        skip.push(name)
      }
    }
  }

  return { grant, create, skip }
}
```

**Step 4:** Run tests to confirm they pass:

```bash
pnpm test:unit --run scripts/bio-tool/lib/basecamp-people.test.ts
```

Expected: all tests PASS.

**Step 5:** Commit:

```bash
git add scripts/bio-tool/lib/basecamp-people.ts scripts/bio-tool/lib/basecamp-people.test.ts
git commit -m "feat: add basecamp-people filtering and partitioning logic with tests"
```

---

## Task 4: Create the main script skeleton with API helpers

**Files:**
- Create: `scripts/bio-tool/add-to-basecamp.ts`

**Step 1:** Create the file. The top section handles auth, API base, and the three fetch helpers:

```typescript
import "./lib/env"
import { load as yamlLoad } from "js-yaml"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { requireEnv } from "./lib/env"
import { getAllEmails } from "./lib/manifest"
import {
  isOnlyBoardMember,
  hasStaffPositions,
  fullName,
  partitionPeople,
  type YamlPerson,
  type BasecampPerson,
} from "./lib/basecamp-people"

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))

const ACCOUNT_ID = "5732828"
const API_BASE = `https://3.basecampapi.com/${ACCOUNT_ID}`

function basecampFetch(token: string, path: string, options?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "PostPlayhouse Bio Tool (don@postplayhouse.com)",
      ...(options?.headers ?? {}),
    },
  })
}

async function fetchAllPeople(token: string): Promise<BasecampPerson[]> {
  const all: BasecampPerson[] = []
  let url: string | null = `${API_BASE}/people.json`
  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "PostPlayhouse Bio Tool (don@postplayhouse.com)",
      },
    })
    if (!res.ok) throw new Error(`GET /people.json failed: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as BasecampPerson[]
    all.push(...data)
    const link = res.headers.get("Link")
    const next = link?.match(/<([^>]+)>;\s*rel="next"/)
    url = next ? next[1] : null
  }
  return all
}

async function fetchProjects(token: string): Promise<{ id: number; name: string }[]> {
  const res = await basecampFetch(token, "/projects.json")
  if (!res.ok) throw new Error(`GET /projects.json failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function addPeopleToProject(
  token: string,
  projectId: number,
  grant: number[],
  create: { name: string; email_address: string }[],
) {
  const res = await basecampFetch(token, `/projects/${projectId}/people/users.json`, {
    method: "PUT",
    body: JSON.stringify({ grant, create }),
  })
  if (!res.ok) throw new Error(`PUT /projects/${projectId}/people/users.json failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  console.log("") // placeholder — filled in Task 5
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

**Step 2:** Verify it compiles (no logic yet, just check for import errors):

```bash
pnpm tsx scripts/bio-tool/add-to-basecamp.ts
```

Expected: no output and no errors.

**Step 3:** Commit:

```bash
git add scripts/bio-tool/add-to-basecamp.ts
git commit -m "feat: add-to-basecamp script skeleton with API helpers"
```

---

## Task 5: Implement `main()` — load data, build plans, print confirmation

**Files:**
- Modify: `scripts/bio-tool/add-to-basecamp.ts` (replace the `main()` stub)

**Step 1:** Replace the `main()` function body with:

```typescript
async function main() {
  const token = requireEnv("BASECAMP_TOKEN")

  // --- Load and filter YAML ---
  const yamlPath = resolve(__dirname, "../../../src/data/people/2026.yml")
  const people = yamlLoad(readFileSync(yamlPath, "utf-8")) as YamlPerson[]

  const callBoardPeople = people.filter((p) => !isOnlyBoardMember(p))
  const productionStaffPeople = people.filter((p) => hasStaffPositions(p))

  console.log(`Virtual Call Board candidates: ${callBoardPeople.length}`)
  console.log(`Production Staff candidates:   ${productionStaffPeople.length}`)

  // --- Fetch Basecamp data ---
  console.log("\nFetching Basecamp account data...")
  const [basecampPeople, projects] = await Promise.all([
    fetchAllPeople(token),
    fetchProjects(token),
  ])
  console.log(`  ${basecampPeople.length} people in Basecamp account`)
  console.log(`  ${projects.length} projects found`)

  const findProject = (name: string) => {
    const p = projects.find((p) => p.name === name)
    if (!p) throw new Error(`Project not found in Basecamp: "${name}"`)
    return p
  }

  const callBoardProject = findProject("Virtual Call Board 2026")
  const productionStaffProject = findProject("Production Staff 2026")

  // --- Build email manifest lookup ---
  const emails = getAllEmails()
  const emailManifest = new Map(emails.map(({ name, email }) => [name, email]))

  // --- Partition people ---
  const callBoardPlan = partitionPeople(callBoardPeople, basecampPeople, emailManifest)
  const productionStaffPlan = partitionPeople(productionStaffPeople, basecampPeople, emailManifest)

  // --- Print plan ---
  function printPlan(label: string, plan: ReturnType<typeof partitionPeople>) {
    console.log(`\n${"─".repeat(60)}`)
    console.log(`  ${label}`)
    console.log("─".repeat(60))
    console.log(`  Grant access (existing accounts): ${plan.grant.length}`)
    console.log(`  Invite by email (new):            ${plan.create.length}`)
    console.log(`  Skipped (no account, no email):   ${plan.skip.length}`)

    if (plan.create.length) {
      console.log("\n  Invitations to send:")
      for (const { name, email_address } of plan.create) {
        console.log(`    • ${name} <${email_address}>`)
      }
    }
    if (plan.skip.length) {
      console.log("\n  ⚠ Cannot add (no Basecamp account and no email in manifest):")
      for (const name of plan.skip) {
        console.log(`    • ${name}`)
      }
    }
  }

  printPlan("Virtual Call Board 2026", callBoardPlan)
  printPlan("Production Staff 2026", productionStaffPlan)

  // --- Confirmation ---
  console.log("\n")
  const { confirm } = await import("@inquirer/prompts")
  const proceed = await confirm({ message: "Proceed with the above changes?", default: false })
  if (!proceed) {
    console.log("Aborted.")
    process.exit(0)
  }

  // --- Execute ---
  console.log("\nAdding people...")

  const cbResult = await addPeopleToProject(
    token,
    callBoardProject.id,
    callBoardPlan.grant,
    callBoardPlan.create,
  )
  console.log(`  Virtual Call Board 2026: ${cbResult.granted?.length ?? 0} granted, ${cbResult.created?.length ?? 0} invited`)

  const psResult = await addPeopleToProject(
    token,
    productionStaffProject.id,
    productionStaffPlan.grant,
    productionStaffPlan.create,
  )
  console.log(`  Production Staff 2026:   ${psResult.granted?.length ?? 0} granted, ${psResult.created?.length ?? 0} invited`)

  if (callBoardPlan.skip.length || productionStaffPlan.skip.length) {
    console.log("\n⚠ The following people were skipped (run bio:emails first to collect their emails):")
    for (const name of [...new Set([...callBoardPlan.skip, ...productionStaffPlan.skip])]) {
      console.log(`  • ${name}`)
    }
  }

  console.log("\nDone.")
}
```

**Step 2:** Verify it compiles cleanly (will fail at runtime without a real token, which is fine at this stage):

```bash
pnpm tsx --no-run scripts/bio-tool/add-to-basecamp.ts 2>&1 || true
```

Actually just run the TypeScript compiler check:

```bash
pnpm check 2>&1 | grep add-to-basecamp || echo "No errors for this file"
```

**Step 3:** Commit:

```bash
git add scripts/bio-tool/add-to-basecamp.ts
git commit -m "feat: implement add-to-basecamp main logic with confirmation step"
```

---

## Task 6: Manual smoke test

**Prerequisites:** `BASECAMP_TOKEN` must be set in `.env`.

**Step 1:** Run the email collection script first so the manifest is populated:

```bash
pnpm bio:emails
```

**Step 2:** Run the Basecamp script:

```bash
pnpm bio:basecamp
```

**Expected output:**
```
Virtual Call Board candidates: N
Production Staff candidates:   N

Fetching Basecamp account data...
  N people in Basecamp account
  N projects found

────────────────────────────────────────────────────────────
  Virtual Call Board 2026
────────────────────────────────────────────────────────────
  Grant access (existing accounts): N
  Invite by email (new):            N
  Skipped (no account, no email):   N
  ...

────────────────────────────────────────────────────────────
  Production Staff 2026
────────────────────────────────────────────────────────────
  ...

? Proceed with the above changes? (y/N)
```

**Step 3:** Enter `N` to abort without making changes. Confirm output is `Aborted.` and nothing was changed in Basecamp.

**Step 4:** Re-run and enter `y`. Confirm the summary shows the expected counts.

---

## Notes

- The `@inquirer/prompts` package is already a dev dependency — no new packages needed.
- The Basecamp `PUT /projects/{id}/people/users.json` response shape includes `granted` and `created` arrays; the summary uses those counts.
- If a project name changes, update the string literals in `main()`. No config file is needed for a one-time annual script.
- Run `pnpm bio:emails` before `pnpm bio:basecamp` if you want to maximize the number of people invited by email rather than skipped.
