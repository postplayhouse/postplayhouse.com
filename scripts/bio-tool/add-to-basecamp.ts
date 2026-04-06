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
