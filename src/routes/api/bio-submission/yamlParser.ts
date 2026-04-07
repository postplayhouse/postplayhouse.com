export type ExistingBioData = {
  firstName: string
  lastName: string
  location: string
  bio: string
  programBio: string
  imageYear: number | null
  imageFile: string
  staffPositions: string[]
  roles: { productionName: string; positions: string[] }[]
  productionPositions: { productionName: string; positions: string[] }[]
  groups: string[]
  positions: string[]
}

/**
 * Extract and parse the YAML block for a given position number.
 * Returns null if the position markers are not found or the block is empty.
 */
export function parseExistingBio(
  yamlContent: string,
  position: number,
): ExistingBioData | null {
  const block = extractBlock(yamlContent, position)
  if (block === null) return null

  // Normalize the first line: `- last_name: ...` -> `  last_name: ...`
  const normalized = block.replace(/^- /, "  ")
  const lines = normalized.split("\n")

  return {
    firstName: getField(lines, "first_name"),
    lastName: getField(lines, "last_name"),
    location: getField(lines, "location"),
    bio: getMultilineField(lines, "bio"),
    programBio: getMultilineField(lines, "program_bio"),
    imageYear: parseImageYear(getField(lines, "image_year")),
    imageFile: getField(lines, "image_file"),
    staffPositions: getListField(lines, "staff_positions"),
    roles: getMapField(lines, "roles"),
    productionPositions: getMapField(lines, "production_positions"),
    groups: getListField(lines, "groups"),
    positions: getListField(lines, "positions"),
  }
}

function extractBlock(yamlContent: string, position: number): string | null {
  const startTag = `# start __${position}__`
  const endTag = `# end __${position}__`
  const startIdx = yamlContent.indexOf(startTag)
  const endIdx = yamlContent.indexOf(endTag)

  if (startIdx === -1 || endIdx === -1) return null

  const content = yamlContent
    .slice(startIdx + startTag.length + 1, endIdx)
    .trimEnd()

  if (content.length === 0) return null

  return content
}

function parseImageYear(value: string): number | null {
  if (!value) return null
  const num = parseInt(value, 10)
  return isNaN(num) ? null : num
}

/** Strip surrounding quotes from a string value. */
function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

/**
 * Get a simple scalar field value.
 * Looks for `  field_name: value` at 2-space indent.
 */
function getField(lines: string[], fieldName: string): string {
  const prefix = `  ${fieldName}: `
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      return stripQuotes(line.slice(prefix.length).trim())
    }
  }
  return ""
}

/**
 * Get a multiline block scalar field (YAML `|` syntax).
 * Content lines are indented with 4 spaces.
 */
function getMultilineField(lines: string[], fieldName: string): string {
  const prefix = `  ${fieldName}: |`
  let collecting = false
  const result: string[] = []

  for (const line of lines) {
    if (collecting) {
      if (line.startsWith("    ")) {
        result.push(line.slice(4))
      } else if (line === "") {
        // Blank lines within the block scalar are preserved
        result.push("")
      } else {
        break
      }
    } else if (line.startsWith(prefix)) {
      collecting = true
    }
  }

  return result.join("\n").trim()
}

/**
 * Get a simple list field (4-space indent `- item`).
 */
function getListField(lines: string[], fieldName: string): string[] {
  const prefix = `  ${fieldName}:`
  let collecting = false
  const result: string[] = []

  for (const line of lines) {
    if (collecting) {
      if (line.startsWith("    - ")) {
        result.push(line.slice(6).trim())
      } else if (line === "") {
        continue
      } else {
        break
      }
    } else if (line === prefix) {
      collecting = true
    }
  }

  return result
}

/**
 * Get a map field like roles or production_positions.
 * Structure:
 *   roles:
 *     Production Name:
 *       - Position
 */
function getMapField(
  lines: string[],
  fieldName: string,
): { productionName: string; positions: string[] }[] {
  const prefix = `  ${fieldName}:`
  let collecting = false
  const result: { productionName: string; positions: string[] }[] = []
  let current: { productionName: string; positions: string[] } | null = null

  for (const line of lines) {
    if (collecting) {
      // Production name at 4-space indent (not starting with `- `)
      if (line.match(/^ {4}\S/) && !line.startsWith("    - ")) {
        if (current) result.push(current)
        const name = line.slice(4).replace(/:$/, "").trim()
        current = { productionName: name, positions: [] }
      } else if (line.startsWith("      - ") && current) {
        current.positions.push(line.slice(8).trim())
      } else if (line === "") {
        continue
      } else if (!line.startsWith("    ") && !line.startsWith("      ")) {
        break
      }
    } else if (line === prefix) {
      collecting = true
    }
  }

  if (current) result.push(current)
  return result
}
