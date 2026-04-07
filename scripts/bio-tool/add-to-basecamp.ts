import "./lib/env"
import { load as yamlLoad } from "js-yaml"
import { readFileSync } from "fs"
import { requireEnv } from "./lib/env"
import { getAllEmails } from "./lib/manifest"
import { getCurrentSeason, seasonYamlPath } from "./lib/season"
import {
  isOnlyBoardMember,
  hasStaffPositions,
  fullName,
  partitionPeople,
  type YamlPerson,
  type BasecampPerson,
} from "./lib/basecamp-people"

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
  let path: string | null = "/people.json"
  while (path) {
    const res = await basecampFetch(token, path)
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as BasecampPerson[]
    all.push(...data)
    const link = res.headers.get("Link")
    const next = link?.match(/<https:\/\/3\.basecampapi\.com\/\d+([^>]+)>;\s*rel="next"/)
    path = next ? next[1] : null
  }
  return all
}

async function fetchProjects(token: string): Promise<{ id: number; name: string }[]> {
  const res = await basecampFetch(token, "/projects.json")
  if (!res.ok) throw new Error(`GET /projects.json failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function fetchProjectMembers(token: string, projectId: number): Promise<Set<number>> {
  const res = await basecampFetch(token, `/projects/${projectId}/people.json`)
  if (!res.ok) throw new Error(`GET /projects/${projectId}/people.json failed: ${res.status} ${await res.text()}`)
  const members = (await res.json()) as { id: number }[]
  return new Set(members.map((m) => m.id))
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
  const token = requireEnv("BASECAMP_TOKEN")

  // --- Load and filter YAML ---
  const season = getCurrentSeason()
  const people = yamlLoad(readFileSync(seasonYamlPath(season), "utf-8")) as YamlPerson[]

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

  const callBoardProject = findProject(requireEnv("BASECAMP_CALL_BOARD_PROJECT"))
  const productionStaffProject = findProject(requireEnv("BASECAMP_PRODUCTION_PROJECT"))

  // --- Fetch existing project members ---
  console.log("\nFetching existing project members...")
  const [callBoardMembers, productionStaffMembers] = await Promise.all([
    fetchProjectMembers(token, callBoardProject.id),
    fetchProjectMembers(token, productionStaffProject.id),
  ])
  console.log(`  Virtual Call Board 2026: ${callBoardMembers.size} existing members`)
  console.log(`  Production Staff 2026:   ${productionStaffMembers.size} existing members`)

  // --- Build email manifest lookup ---
  const emails = getAllEmails()
  const emailManifest = new Map(emails.map(({ name, email }) => [name, email]))

  // --- Partition people ---
  // Partition against full account to find everyone, then split grant into already-member vs. needs-adding
  const callBoardFull = partitionPeople(callBoardPeople, basecampPeople, emailManifest)
  const productionStaffFull = partitionPeople(productionStaffPeople, basecampPeople, emailManifest)

  const callBoardPlan = {
    grant: callBoardFull.grant.filter((id) => !callBoardMembers.has(id)),
    create: callBoardFull.create,
    skip: callBoardFull.skip,
    existing: callBoardFull.grant.filter((id) => callBoardMembers.has(id)),
  }
  const productionStaffPlan = {
    grant: productionStaffFull.grant.filter((id) => !productionStaffMembers.has(id)),
    create: productionStaffFull.create,
    skip: productionStaffFull.skip,
    existing: productionStaffFull.grant.filter((id) => productionStaffMembers.has(id)),
  }

  // --- Build checkbox TUI ---
  type ChoiceValue =
    | { projectId: number; type: "grant"; id: number; name: string }
    | { projectId: number; type: "create"; name: string; email_address: string }

  const basecampById = new Map(basecampPeople.map((p) => [p.id, p.name]))

  const { checkbox, Separator } = await import("@inquirer/prompts")

  function projectChoices(
    projectId: number,
    plan: typeof callBoardPlan,
  ) {
    type Choice =
      | { value: ChoiceValue; name: string; checked: true }
      | { value: null; name: string; disabled: string }

    const sections: (Choice | InstanceType<typeof Separator>)[] = []

    if (plan.existing.length) {
      sections.push(new Separator("  · already members ·"))
      sections.push(...plan.existing.map((id) => ({
        value: null,
        name: `${basecampById.get(id) ?? `ID ${id}`}`,
        disabled: "already a member",
      } satisfies Choice)))
    }

    if (plan.grant.length) {
      sections.push(new Separator("  · existing Basecamp accounts ·"))
      sections.push(...plan.grant.map((id) => ({
        value: { projectId, type: "grant" as const, id, name: basecampById.get(id) ?? `ID ${id}` },
        name: `${basecampById.get(id) ?? `ID ${id}`}`,
        checked: true as const,
      } satisfies Choice)))
    }

    if (plan.create.length) {
      sections.push(new Separator("  · invite by email ·"))
      sections.push(...plan.create.map((entry) => ({
        value: { projectId, type: "create" as const, ...entry },
        name: `${entry.name} <${entry.email_address}>`,
        checked: true as const,
      } satisfies Choice)))
    }

    if (plan.skip.length) {
      sections.push(new Separator("  · no email found ·"))
      sections.push(...plan.skip.map((name) => ({
        value: null,
        name,
        disabled: "run bio:emails first",
      } satisfies Choice)))
    }

    return sections
  }

  const selected = (await checkbox<ChoiceValue | null>({
    message: "Select people to add (deselect anyone to exclude them):",
    pageSize: 30,
    choices: [
      new Separator(`─── ${callBoardProject.name} ${"─".repeat(30)}`),
      ...projectChoices(callBoardProject.id, callBoardPlan),
      new Separator(`─── ${productionStaffProject.name} ${"─".repeat(32)}`),
      ...projectChoices(productionStaffProject.id, productionStaffPlan),
    ],
  })).filter((v): v is ChoiceValue => v !== null)

  if (selected.length === 0) {
    console.log("Nothing selected. Aborted.")
    process.exit(0)
  }

  type GrantValue = Extract<ChoiceValue, { type: "grant" }>
  type CreateValue = Extract<ChoiceValue, { type: "create" }>

  const forProject = (projectId: number) => selected.filter((v) => v.projectId === projectId)
  const toGrant = (vals: ChoiceValue[]) =>
    vals.filter((v): v is GrantValue => v.type === "grant").map((v) => v.id)
  const toCreate = (vals: ChoiceValue[]) =>
    vals.filter((v): v is CreateValue => v.type === "create").map(({ name, email_address }) => ({ name, email_address }))

  const cbGrant = toGrant(forProject(callBoardProject.id))
  const cbCreate = toCreate(forProject(callBoardProject.id))
  const psGrant = toGrant(forProject(productionStaffProject.id))
  const psCreate = toCreate(forProject(productionStaffProject.id))

  // --- Execute ---
  console.log("\nAdding people...")

  const cbResult = await addPeopleToProject(token, callBoardProject.id, cbGrant, cbCreate)
  console.log(`  ${callBoardProject.name}: ${(cbResult.granted?.length ?? 0) + (cbResult.created?.length ?? 0)} added`)

  const psResult = await addPeopleToProject(token, productionStaffProject.id, psGrant, psCreate)
  console.log(`  ${productionStaffProject.name}: ${(psResult.granted?.length ?? 0) + (psResult.created?.length ?? 0)} added`)

  const allSkipped = [...new Set([...callBoardPlan.skip, ...productionStaffPlan.skip])]
  if (allSkipped.length) {
    console.log("\nSkipped (run bio:emails to collect their addresses):")
    for (const name of allSkipped) {
      console.log(`  • ${name}`)
    }
  }

  console.log("\nDone.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
