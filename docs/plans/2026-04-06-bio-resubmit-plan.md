# Bio Resubmit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow returning users to edit and resubmit their bios at `/bio-submission` by fetching existing data after passphrase auth.

**Architecture:** New server endpoint fetches existing bio YAML from GitHub (PR branch first, master fallback), parses it into structured form fields, and returns it to the client. The frontend calls this after passphrase confirmation and pre-fills the form. Submission logic is unchanged.

**Tech Stack:** SvelteKit, TypeScript, Octokit (GitHub API), YAML parsing (string-based, no library needed — the YAML is simple and regular)

---

### Task 1: Add YAML parsing utility

**Files:**
- Create: `src/routes/api/bio-submission/yamlParser.ts`

**Step 1: Create the YAML block parser**

This function extracts the YAML block for a given position from the full YAML file content, then parses the relevant fields. The YAML in this project is simple and regular (no nested objects beyond one level), so we parse it with string splitting rather than a YAML library.

```typescript
export type ExistingBioData = {
  firstName: string
  lastName: string
  location: string
  bio: string
  programBio: string
  imageYear: number | null
  imageFile: string
  staffPositions: string[]
  roles: { productionName: string; positions: string[] }[]
  productionPositions: { productionName: string; positions: string[] }[]
  groups: string[]
  positions: string[]
}

export function parseExistingBio(
  yamlContent: string,
  position: number,
): ExistingBioData | null {
  const markerId = `__${position}__`
  const startTag = `# start ${markerId}`
  const endTag = `# end ${markerId}`
  const startIdx = yamlContent.indexOf(startTag)
  const endIdx = yamlContent.indexOf(endTag)

  if (startIdx === -1 || endIdx === -1) return null

  const block = yamlContent.slice(startIdx + startTag.length, endIdx).trim()
  if (!block) return null

  // Parse individual fields from the YAML block
  // The block starts with "- last_name: ..." and subsequent fields are indented with 2 spaces
  const lines = block.split("\n")

  function getField(fieldName: string): string {
    const prefix = `  ${fieldName}: `
    const line = lines.find((l) => l.startsWith(prefix))
    if (!line) return ""
    let value = line.slice(prefix.length).trim()
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    return value
  }

  function getMultilineField(fieldName: string): string {
    const prefix = `  ${fieldName}: |`
    const idx = lines.findIndex((l) => l.trimEnd() === prefix)
    if (idx === -1) return ""
    const contentLines: string[] = []
    for (let i = idx + 1; i < lines.length; i++) {
      if (lines[i].startsWith("    ") || lines[i].trim() === "") {
        contentLines.push(lines[i].slice(4)) // remove 4-space indent
      } else {
        break
      }
    }
    return contentLines.join("\n").trim()
  }

  function getListField(fieldName: string): string[] {
    const prefix = `  ${fieldName}:`
    const idx = lines.findIndex((l) => l.trimEnd() === prefix)
    if (idx === -1) return []
    const items: string[] = []
    for (let i = idx + 1; i < lines.length; i++) {
      const match = lines[i].match(/^ {4}- (.+)$/)
      if (match) {
        items.push(match[1].trim())
      } else if (!lines[i].startsWith("    ")) {
        break
      }
    }
    return items
  }

  function getMapField(fieldName: string): { productionName: string; positions: string[] }[] {
    const prefix = `  ${fieldName}:`
    const idx = lines.findIndex((l) => l.trimEnd() === prefix)
    if (idx === -1) return []
    const result: { productionName: string; positions: string[] }[] = []
    let currentProduction: string | null = null
    let currentPositions: string[] = []

    for (let i = idx + 1; i < lines.length; i++) {
      const line = lines[i]
      // Production name line: "    Production Name:"
      const prodMatch = line.match(/^ {4}(.+):$/)
      // Position line: "      - Position"
      const posMatch = line.match(/^ {6}- (.+)$/)

      if (prodMatch) {
        if (currentProduction) {
          result.push({ productionName: currentProduction, positions: currentPositions })
        }
        currentProduction = prodMatch[1].trim()
        currentPositions = []
      } else if (posMatch && currentProduction) {
        currentPositions.push(posMatch[1].trim())
      } else if (!line.startsWith("    ")) {
        break
      }
    }
    if (currentProduction) {
      result.push({ productionName: currentProduction, positions: currentPositions })
    }
    return result
  }

  // Handle first line specially: "- last_name: Value" (leading "- ")
  const firstLineField = lines[0]?.replace(/^- /, "  ")
  const adjustedLines = [firstLineField, ...lines.slice(1)]

  // Re-assign lines for parsing with normalized indentation
  lines.splice(0, lines.length, ...adjustedLines)

  return {
    firstName: getField("first_name"),
    lastName: getField("last_name"),
    location: getField("location"),
    bio: getMultilineField("bio"),
    programBio: getMultilineField("program_bio"),
    imageYear: getField("image_year") ? Number(getField("image_year")) : null,
    imageFile: getField("image_file"),
    staffPositions: getListField("staff_positions"),
    roles: getMapField("roles"),
    productionPositions: getMapField("production_positions"),
    groups: getListField("groups"),
    positions: getListField("positions"),
  }
}
```

**Step 2: Verify typecheck passes**

Run: `pnpm check`
Expected: No errors related to `yamlParser.ts`

**Step 3: Commit**

```bash
git add src/routes/api/bio-submission/yamlParser.ts
git commit -m "Add YAML parser for existing bio data"
```

---

### Task 2: Add GitHub fetch helper for existing bio

**Files:**
- Modify: `src/routes/api/bio-submission/githubHelpers.ts`

**Step 1: Export a function to fetch file content from a branch**

Add this exported function to `githubHelpers.ts`. It reuses the existing `octokit` instance and is a thin wrapper around `getPreviousFileContent` plus branch existence checking:

```typescript
export async function fetchFileFromBranch({
  owner,
  repo,
  filePath,
  branchName,
}: {
  owner: string
  repo: string
  filePath: string
  branchName: string
}): Promise<{ found: true; content: string } | { found: false }> {
  try {
    // Check if branch exists
    await octokit.git.getRef({ owner, repo, ref: `heads/${branchName}` })
  } catch {
    return { found: false }
  }

  const result = await getPreviousFileContent({ owner, repo, filePath, branchName })
  if (result.success) {
    return { found: true, content: result.previousContent }
  }
  return { found: false }
}
```

**Step 2: Verify typecheck passes**

Run: `pnpm check`

**Step 3: Commit**

```bash
git add src/routes/api/bio-submission/githubHelpers.ts
git commit -m "Add fetchFileFromBranch helper for reading existing bios"
```

---

### Task 3: Create the existing-bio API endpoint

**Files:**
- Create: `src/routes/api/bio-submission/existing-bio/+server.ts`

**Step 1: Create the endpoint**

```typescript
import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { fetchFileFromBranch } from "../githubHelpers"
import { parseExistingBio } from "../yamlParser"
import * as site from "$data/site"

export const GET = async ({ request }) => {
  const result = individualPassphraseDetails(request)

  if (!result.correct) {
    return json(
      { error: "Invalid Passphrase", message: "The passphrase you gave was incorrect." },
      { status: 403 },
    )
  }

  const { position } = result
  const owner = "postplayhouse"
  const repo = "postplayhouse.com"
  const filePath = `src/data/people/${site.season}.yml`
  const prBranch = `bio-update/position-${position}`

  // Try PR branch first, fall back to master
  let yamlContent: string | null = null
  let source: "pr" | "master" = "master"

  const prResult = await fetchFileFromBranch({ owner, repo, filePath, branchName: prBranch })
  if (prResult.found) {
    yamlContent = prResult.content
    source = "pr"
  } else {
    const masterResult = await fetchFileFromBranch({ owner, repo, filePath, branchName: "master" })
    if (masterResult.found) {
      yamlContent = masterResult.content
    }
  }

  if (!yamlContent) {
    return json({ data: null, source: null })
  }

  const bioData = parseExistingBio(yamlContent, position)

  return json({ data: bioData, source })
}
```

**Step 2: Verify typecheck passes**

Run: `pnpm check`

**Step 3: Commit**

```bash
git add src/routes/api/bio-submission/existing-bio/+server.ts
git commit -m "Add GET /api/bio-submission/existing-bio endpoint"
```

---

### Task 4: Fetch existing bio after passphrase confirmation (frontend)

**Files:**
- Modify: `src/routes/(app)/bio-submission/+page.svelte`

**Step 1: Add a loading state**

Add a new state and event to the state machine for loading existing data. After `confirmedPassphrase`, transition to a `loadingExistingBio` state, then to `incompleteForm` when done.

Add to the `states` object:
```typescript
loadingExistingBio: "loadingExistingBio",
```

Add to the `events` object:
```typescript
existingBioLoaded: "existingBioLoaded",
```

**Step 2: Add the fetch + pre-fill function**

After the `confirmPassphrase` function (around line 420), add:

```typescript
let isReturningUser = $state(false)

async function fetchAndPrefillExistingBio() {
  try {
    const res = await window.fetch("/api/bio-submission/existing-bio", {
      method: "GET",
      headers: new Headers({
        Authorization: sanitizedPassphrase(passphrase),
      }),
    })
    if (res.ok) {
      const { data, source } = await res.json()
      if (data) {
        isReturningUser = true
        fields.firstName = data.firstName ?? ""
        fields.lastName = data.lastName ?? ""
        fields.location = data.location ?? ""
        fields.email = "" // Not stored in YAML, user must re-enter
        fields.bio = data.programBio || data.bio || ""
        if (data.programBio && data.bio) {
          fields.addLongerBio = true
          fields.longerBio = data.bio
        }
        roles = data.roles ?? []
        staffPositions = data.staffPositions ?? []
        productionPositions = data.productionPositions ?? []
        positions = data.positions ?? []

        // Pre-select existing headshot
        if (data.imageYear) {
          const imageName = data.imageFile || `${safeName(data.firstName)}-${safeName(data.lastName)}`
          // Find matching image in the available options
          const matchingImage = imageFiles.find((f) =>
            f.includes(`/${data.imageYear}/`) && f.includes(imageName)
          )
          if (matchingImage) {
            fields.useOldHeadshot = true
            fields.oldImageSrcPath = matchingImage
          }
        }
      }
    }
  } catch {
    // Non-fatal — proceed with empty form
  }
  dispatch(events.existingBioLoaded)
}
```

Note: `imageFiles` comes from `data` (the page load data). Ensure it's destructured from `data` — it already is on line 19: `const { disabled, productions: productions_, imageFiles } = $derived(data)`.

**Step 3: Wire up the state machine**

Modify the `requestingAuth` case in the `dispatch` function. Change the `confirmedPassphrase` handler from:
```typescript
case events.confirmedPassphrase: {
  return (pageState = states.incompleteForm)
}
```
to:
```typescript
case events.confirmedPassphrase: {
  fetchAndPrefillExistingBio()
  return (pageState = states.loadingExistingBio)
}
```

Add a new case in the `dispatch` function's switch (after `requestingAuth` case):
```typescript
case states.loadingExistingBio: {
  switch (event) {
    case events.existingBioLoaded: {
      return (pageState = invalidForm ? states.incompleteForm : states.completeForm)
    }
    default:
      return
  }
}
```

Add `states.loadingExistingBio` to the `submitting` derived:
```typescript
let submitting = $derived(
  [states.requestingAuth, states.loadingExistingBio, states.sendingHeadshotBio].includes(pageState),
)
```

**Step 4: Verify typecheck passes**

Run: `pnpm check`

**Step 5: Commit**

```bash
git add src/routes/(app)/bio-submission/+page.svelte
git commit -m "Fetch and pre-fill existing bio data after passphrase auth"
```

---

### Task 5: Update headshot UI for returning users

**Files:**
- Modify: `src/routes/(app)/bio-submission/+page.svelte`

**Step 1: Update the headshot checkbox label**

Find the headshot checkbox label (around line 850-852):
```svelte
I've worked at Post before, and I'd like to use my old headshot.
```

Change to:
```svelte
{#if isReturningUser}
  Keep my current headshot.
{:else}
  I've worked at Post before, and I'd like to use my old headshot.
{/if}
```

**Step 2: Verify typecheck passes**

Run: `pnpm check`

**Step 3: Commit**

```bash
git add src/routes/(app)/bio-submission/+page.svelte
git commit -m "Adjust headshot label for returning users"
```

---

### Task 6: Add loading indicator for existing bio fetch

**Files:**
- Modify: `src/routes/(app)/bio-submission/+page.svelte`

**Step 1: Show a loading state while fetching existing bio**

The `showCredsForm` derived already covers `requestingAuth`, so after the passphrase is confirmed and we're in `loadingExistingBio`, neither `showCredsForm` nor `showMain` will be true. Add a loading message.

After the `{#if showCredsForm}...{/if}` block (around line 804), add:

```svelte
{#if pageState === states.loadingExistingBio}
  <p class="my-8 text-xl">Loading your information...</p>
{/if}
```

**Step 2: Verify typecheck passes**

Run: `pnpm check`

**Step 3: Commit**

```bash
git add src/routes/(app)/bio-submission/+page.svelte
git commit -m "Add loading indicator for existing bio fetch"
```

---

### Task 7: Pre-fill role/position inputs for returning users

**Files:**
- Modify: `src/routes/(app)/bio-submission/+page.svelte`

**Step 1: Set initial values on production input fields**

The role and production position inputs (around lines 936-947 and 997-1007) use `oninput` handlers but have no `value` binding. For returning users with pre-filled `roles` and `productionPositions`, we need to set the initial value.

For the acting roles inputs, change:
```svelte
<input
  class="block"
  type="text"
  oninput={(e) => {
    mutateRoles(production, e.currentTarget.value)
  }}
/>
```
to:
```svelte
<input
  class="block"
  type="text"
  value={roles.find((r) => r.productionName === production)?.positions.join(", ") ?? ""}
  oninput={(e) => {
    mutateRoles(production, e.currentTarget.value)
  }}
/>
```

For the production positions inputs, change:
```svelte
<input
  class="block"
  type="text"
  oninput={(e) =>
    mutateProductionPositions(production, e.currentTarget.value)}
/>
```
to:
```svelte
<input
  class="block"
  type="text"
  value={productionPositions.find((r) => r.productionName === production)?.positions.join(", ") ?? ""}
  oninput={(e) =>
    mutateProductionPositions(production, e.currentTarget.value)}
/>
```

For the staff positions "Entire Season" input, change:
```svelte
<input
  class="block"
  type="text"
  oninput={(e) => mutateStaffPositions(e.currentTarget.value)}
/>
```
to:
```svelte
<input
  class="block"
  type="text"
  value={staffPositions.join(", ")}
  oninput={(e) => mutateStaffPositions(e.currentTarget.value)}
/>
```

**Step 2: Verify typecheck passes**

Run: `pnpm check`

**Step 3: Commit**

```bash
git add src/routes/(app)/bio-submission/+page.svelte
git commit -m "Pre-fill role and position inputs for returning users"
```

---

### Task 8: Manual integration test

**Step 1: Start the dev server**

Run: `pnpm dev`

**Step 2: Test the full flow**

1. Navigate to `/bio-submission`
2. Enter a valid passphrase (from `INDIVIDUAL_PASSPHRASES_LIST` in `.env`)
3. Verify the "Loading your information..." message appears briefly
4. Verify form fields are pre-filled with existing data
5. Verify headshot shows "Keep my current headshot" label (if data exists)
6. Verify roles/positions inputs show existing values
7. Modify a field and submit
8. Verify the submission succeeds (updates the existing PR branch)
9. Test with a passphrase that has no existing data — verify empty form works as before

**Step 3: Final typecheck and build**

Run: `pnpm check && pnpm build`
Expected: No errors

**Step 4: Commit any remaining fixes**

If fixes were needed during testing, commit them.
