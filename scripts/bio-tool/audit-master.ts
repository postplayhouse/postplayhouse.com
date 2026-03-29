import { load as yamlLoad } from "js-yaml"
import { getCurrentSeason, seasonYamlPath } from "./lib/season"
import { readSeasonYaml, extractPositionBlock } from "./lib/yaml"
import { getPositionBlameTimestamp } from "./lib/git"

interface PersonData {
  first_name: string
  last_name: string
  image_year?: number
  [key: string]: unknown
}

function getAllPositions(yamlContent: string): number[] {
  const positions: number[] = []
  const regex = /# start __(\d+)__/g
  let match
  while ((match = regex.exec(yamlContent)) !== null) {
    positions.push(parseInt(match[1]))
  }
  return positions.sort((a, b) => a - b)
}

function getPersonFromBlock(block: string): { name: string; imageYear: number | null } | null {
  try {
    const parsed = yamlLoad(block) as PersonData[]
    if (parsed?.[0]) {
      return {
        name: `${parsed[0].first_name} ${parsed[0].last_name}`,
        imageYear: parsed[0].image_year ?? null,
      }
    }
  } catch { /* skip */ }
  return null
}

function main() {
  const season = getCurrentSeason()
  const yamlPath = seasonYamlPath(season)
  const yamlContent = readSeasonYaml(yamlPath)
  const positions = getAllPositions(yamlContent)

  const results = positions.map((position) => {
    const block = extractPositionBlock(yamlContent, position)
    const person = block ? getPersonFromBlock(block) : null
    const blameDate = getPositionBlameTimestamp(yamlPath, position, "master")

    return {
      position,
      name: person?.name ?? `Position ${position}`,
      imageYear: person?.imageYear ?? null,
      newestBlame: blameDate?.toISOString() ?? null,
    }
  })

  console.log(JSON.stringify(results, null, 2))
}

main()
