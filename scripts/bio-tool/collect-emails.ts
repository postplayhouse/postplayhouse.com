import "./lib/env"
import { execSync } from "child_process"
import { listFiles, downloadFileById, parseSubmissionFilename } from "./lib/b2"
import { saveEmail, getAllEmails, clearManifest } from "./lib/manifest"
import { getCurrentSeason, seasonYamlPath } from "./lib/season"

function capitalize(s: string): string {
  return s
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-")
}

async function main() {
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)

  // Season window: Sept 1 of previous year through Aug 30 of season year
  const seasonStart = new Date(`${season - 1}-09-01T00:00:00Z`)
  const seasonEnd = new Date(`${season}-08-30T23:59:59Z`)

  console.log(`Current season: ${season} (${seasonStart.toDateString()} – ${seasonEnd.toDateString()})\n`)

  clearManifest()

  console.log("Collecting emails from B2 submissions...")

  const allFiles = await listFiles()
  const bioFiles = allFiles.filter((f) => f.fileName.endsWith(".txt"))

  let found = 0

  for (const file of bioFiles) {
    const parsed = parseSubmissionFilename(file.fileName)
    if (!parsed) continue

    const b2Date = new Date(file.uploadTimestamp)

    // Only include submissions from this season's window
    if (b2Date < seasonStart || b2Date > seasonEnd) continue

    const content = (await downloadFileById(file.fileId)).toString("utf-8")
    const parts = content.split(/\n{3,}/)
    const metadataSection = parts.slice(1).join("\n")

    const positionMatch = metadataSection.match(/bio position:\s*(\d+)/)
    if (!positionMatch) continue
    const position = parseInt(positionMatch[1])

    const emailMatch = metadataSection.match(/[\w.+-]+@[\w.-]+\.\w+/)
    if (emailMatch) {
      const bioYaml = parts[0]
      const firstMatch = bioYaml.match(/first_name:\s*(.+)/)
      const lastMatch = bioYaml.match(/last_name:\s*(.+)/)
      const name =
        firstMatch && lastMatch
          ? `${firstMatch[1].trim()} ${lastMatch[1].trim()}`
          : `${capitalize(parsed.firstName)} ${capitalize(parsed.lastName)}`
      saveEmail(position, name, emailMatch[0])
      found++
    }
  }

  console.log(`  Found ${found} emails from B2`)

  // Also scan PRs: open ones (always current) + recently closed from this year
  console.log("\nCollecting emails from PR descriptions...")
  let prFound = 0
  try {
    const openPrs = JSON.parse(
      execSync(
        `gh pr list --repo postplayhouse/postplayhouse.com --state open --json body,headRefName --limit 100`,
        { encoding: "utf-8", timeout: 15000 },
      ),
    ) as { body: string; headRefName: string }[]

    const closedPrs = JSON.parse(
      execSync(
        `gh pr list --repo postplayhouse/postplayhouse.com --state closed --json body,headRefName,createdAt --limit 200`,
        { encoding: "utf-8", timeout: 15000 },
      ),
    ) as { body: string; headRefName: string; createdAt: string }[]

    const allPrs = [
      ...openPrs,
      ...closedPrs.filter(
        (pr) => new Date(pr.createdAt).getFullYear() === season,
      ),
    ]

    for (const pr of allPrs) {
      const branchMatch = pr.headRefName.match(/^bio-update\/position-(\d+)$/)
      if (!branchMatch) continue
      const position = parseInt(branchMatch[1])

      const match = pr.body.match(
        /Bio \d+ for (.+?) \(([^\s]+)\s*\n\s*who lives at the domain\s*\n\s*([^\s)]+)\)/,
      )
      if (match) {
        const name = match[1]
        const email = `${match[2]}@${match[3]}`
        saveEmail(position, name, email)
        prFound++
      }
    }
  } catch {
    console.log("  Could not fetch PRs (gh CLI unavailable or error)")
  }

  console.log(`  Found ${prFound} emails from PRs`)

  // Show summary
  const all = getAllEmails()
  console.log(`\nManifest now has ${all.length} emails:`)
  for (const { position, name, email } of all.sort((a, b) => a.position - b.position)) {
    console.log(`  Position ${position}: ${name} <${email}>`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
