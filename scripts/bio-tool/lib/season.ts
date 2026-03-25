import { readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))

const peopleDir = resolve(__dirname, "../../../src/data/people")

export function getCurrentSeason(): number {
  const years = readdirSync(peopleDir)
    .filter((f) => /^\d{4}\.yml$/.test(f))
    .map((f) => parseInt(f))
    .sort((a, b) => b - a)

  if (!years.length) throw new Error("No season YAML files found")
  return years[0]
}

export function seasonYamlPath(season: number): string {
  return resolve(peopleDir, `${season}.yml`)
}

export function imagesDir(season: number): string {
  return resolve(__dirname, `../../../src/images/people/${season}`)
}
