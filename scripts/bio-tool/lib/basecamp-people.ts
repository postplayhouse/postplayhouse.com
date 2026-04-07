export interface YamlPerson {
  first_name: string
  last_name: string
  groups?: string[]
  staff_positions?: string[]
  production_positions?: Record<string, string[]>
  [key: string]: unknown
}

export interface BasecampPerson {
  id: number
  name: string
}

export interface CreateEntry {
  name: string
  email_address: string
}

export interface Partition {
  grant: number[]
  create: CreateEntry[]
  skip: string[]
}

export function isOnlyBoardMember(person: Partial<YamlPerson>): boolean {
  const groups = person.groups ?? []
  return groups.length > 0 && groups.every((g) => g === "board")
}

export function hasStaffPositions(person: Partial<YamlPerson>): boolean {
  return Array.isArray(person.staff_positions) && person.staff_positions.length > 0
}

export function hasProductionPositions(person: Partial<YamlPerson>): boolean {
  const pp = person.production_positions
  return pp != null && typeof pp === "object" && Object.keys(pp).length > 0
}

export function fullName(person: Pick<YamlPerson, "first_name" | "last_name">): string {
  return `${person.first_name} ${person.last_name}`
}

export function partitionPeople(
  people: YamlPerson[],
  basecampPeople: BasecampPerson[],
  emailManifest: Map<string, string>,
): Partition {
  const basecampByName = new Map(basecampPeople.map((p) => [p.name, p.id]))
  const grant: number[] = []
  const create: CreateEntry[] = []
  const skip: string[] = []

  for (const person of people) {
    const name = fullName(person)
    const basecampId = basecampByName.get(name)
    if (basecampId !== undefined) {
      grant.push(basecampId)
    } else {
      const email = emailManifest.get(name)
      if (email) {
        create.push({ name, email_address: email })
      } else {
        skip.push(name)
      }
    }
  }

  return { grant, create, skip }
}
