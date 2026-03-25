import { readFileSync, writeFileSync } from "fs"

export function extractPositionBlock(
  yamlContent: string,
  position: number,
): string | null {
  const startTag = `# start __${position}__`
  const endTag = `# end __${position}__`
  const startIdx = yamlContent.indexOf(startTag)
  const endIdx = yamlContent.indexOf(endTag)

  if (startIdx === -1 || endIdx === -1) return null

  return yamlContent.slice(startIdx + startTag.length + 1, endIdx).trimEnd()
}

export function replacePositionBlock(
  yamlContent: string,
  position: number,
  newContent: string,
): string {
  const startTag = `# start __${position}__`
  const endTag = `# end __${position}__`
  const startIdx = yamlContent.indexOf(startTag)
  const endIdx = yamlContent.indexOf(endTag)

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Position markers not found for __${position}__`)
  }

  return `${yamlContent.slice(0, startIdx + startTag.length)}\n${newContent}\n${yamlContent.slice(endIdx)}`
}

export function readSeasonYaml(path: string): string {
  return readFileSync(path, "utf-8").replace(/\r\n/g, "\n")
}

export function writeSeasonYaml(path: string, content: string): void {
  writeFileSync(path, content, "utf-8")
}
