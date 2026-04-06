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

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
