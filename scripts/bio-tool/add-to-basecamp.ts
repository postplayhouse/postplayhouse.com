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

  // --- Build email manifest lookup ---
  const emails = getAllEmails()
  const emailManifest = new Map(emails.map(({ name, email }) => [name, email]))

  // --- Partition people ---
  const callBoardPlan = partitionPeople(callBoardPeople, basecampPeople, emailManifest)
  const productionStaffPlan = partitionPeople(productionStaffPeople, basecampPeople, emailManifest)

  // --- Build checkbox TUI ---
  type ChoiceValue =
    | { projectId: number; type: "grant"; id: number; name: string }
    | { projectId: number; type: "create"; name: string; email_address: string }

  const basecampById = new Map(basecampPeople.map((p) => [p.id, p.name]))

  const { checkbox, Separator } = await import("@inquirer/prompts")

  function projectChoices(
    projectId: number,
    plan: ReturnType<typeof partitionPeople>,
  ) {
    const choices: (
      | { value: ChoiceValue; name: string; checked: true }
      | { value: null; name: string; disabled: string }
    )[] = [
      ...plan.grant.map((id) => ({
        value: { projectId, type: "grant" as const, id, name: basecampById.get(id) ?? `ID ${id}` },
        name: `${basecampById.get(id) ?? `ID ${id}`} (existing account)`,
        checked: true as const,
      })),
      ...plan.create.map((entry) => ({
        value: { projectId, type: "create" as const, ...entry },
        name: `${entry.name} — invite <${entry.email_address}>`,
        checked: true as const,
      })),
      ...plan.skip.map((name) => ({
        value: null,
        name: `${name} (no email in manifest)`,
        disabled: "run bio:emails first",
      })),
    ]
    return choices
  }

  const selected = await checkbox<ChoiceValue>({
    message: "Select people to add (deselect anyone to exclude them):",
    pageSize: 30,
    choices: [
      new Separator(`─── Virtual Call Board 2026 ${"─".repeat(30)}`),
      ...projectChoices(callBoardProject.id, callBoardPlan),
      new Separator(`─── Production Staff 2026 ${"─".repeat(32)}`),
      ...projectChoices(productionStaffProject.id, productionStaffPlan),
    ],
  })

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
  console.log(`  Virtual Call Board 2026: ${cbResult.granted?.length ?? 0} granted, ${cbResult.created?.length ?? 0} invited`)

  const psResult = await addPeopleToProject(token, productionStaffProject.id, psGrant, psCreate)
  console.log(`  Production Staff 2026:   ${psResult.granted?.length ?? 0} granted, ${psResult.created?.length ?? 0} invited`)

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
