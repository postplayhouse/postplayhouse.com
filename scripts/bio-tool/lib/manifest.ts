import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
const manifestDir = resolve(__dirname, "../../../bio-tool.ignore")
const manifestPath = resolve(manifestDir, "emails.json")

interface EmailManifest {
  [position: string]: {
    name: string
    email: string
  }
}

function readManifest(): EmailManifest {
  if (!existsSync(manifestPath)) return {}
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8"))
  } catch {
    return {}
  }
}

function writeManifest(manifest: EmailManifest): void {
  mkdirSync(manifestDir, { recursive: true })
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")
}

export function saveEmail(position: number, name: string, email: string): void {
  const manifest = readManifest()
  manifest[String(position)] = { name, email }
  writeManifest(manifest)
}

export function getEmail(position: number): { name: string; email: string } | null {
  const manifest = readManifest()
  return manifest[String(position)] ?? null
}

export function clearManifest(): void {
  writeManifest({})
}

export function getAllEmails(): { position: number; name: string; email: string }[] {
  const manifest = readManifest()
  return Object.entries(manifest).map(([pos, { name, email }]) => ({
    position: parseInt(pos),
    name,
    email,
  }))
}
