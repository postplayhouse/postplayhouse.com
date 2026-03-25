import { getCurrentSeason, seasonYamlPath } from "./lib/season"
import { readSeasonYaml } from "./lib/yaml"
import { extractAllUrls, verifyUrl } from "./lib/bio-transforms"

/** Check all URLs in the season YAML. Returns true if all links are OK. */
export async function checkAllLinks(): Promise<boolean> {
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)
  const content = readSeasonYaml(yamlPath)

  const urls = extractAllUrls(content)
  if (!urls.length) {
    console.log("No URLs found.")
    return true
  }

  console.log(`Checking ${urls.length} URLs in ${season}.yml...\n`)

  const broken: string[] = []
  const redirected: { url: string; to: string }[] = []
  let ok = 0

  for (const url of urls) {
    const result = await verifyUrl(url)
    if (!result.reachable) {
      const status = result.status ? ` (status: ${result.status})` : ""
      console.log(`  BROKEN: ${url}${status}`)
      broken.push(url)
    } else if (result.redirectedTo) {
      console.log(`  REDIRECT: ${url} → ${result.redirectedTo}`)
      redirected.push({ url, to: result.redirectedTo })
      ok++
    } else {
      ok++
    }
  }

  console.log(`\n--- Summary ---`)
  console.log(`  ${ok} OK, ${broken.length} broken, ${redirected.length} redirected`)

  if (redirected.length) {
    console.log(`\nRedirects:`)
    for (const { url, to } of redirected) {
      console.log(`  ${url}\n    → ${to}`)
    }
  }

  if (broken.length) {
    console.log(`\nBroken:`)
    for (const url of broken) {
      console.log(`  ${url}`)
    }
  }

  return broken.length === 0
}

// Only run when executed directly (not when imported)
const isDirectRun = process.argv[1]?.endsWith("check-links.ts")
if (isDirectRun) {
  checkAllLinks()
    .then((allOk) => { if (!allOk) process.exit(1) })
    .catch((err) => { console.error(err); process.exit(1) })
}
