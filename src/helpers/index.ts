import type { Person } from "../models/Person"

type PersonLike = Person | YamlPerson
export function personIsInGroup(person: PersonLike, groupName: string) {
  return !!(
    Array.isArray(person.groups) &&
    person.groups.map((x) => x.toLowerCase()).includes(groupName.toLowerCase())
  )
}

export function personIsOnlyInGroup(person: PersonLike, groupName: string) {
  return personIsInGroup(person, groupName) && person.groups.length === 1
}

/**
 * Puts people in their corresponding groups. Any ungrouped people come out in
 * the rest
 *
 * @example
 * const {board, additional, rest} = groupPeople(people, 'board', 'additional')
 * // All the people who didn't fit into the above categories are in the rest category
 *
 */
export function groupPeople<G extends string, P extends PersonLike>(
  people: P[],
  ...groupNames: G[]
): Record<G | "rest", P[]> {
  const grouped = {} as Record<G | "rest", P[]>
  const used = [] as P[]
  groupNames.forEach((groupName) => {
    grouped[groupName] = [] as P[]
    people.forEach((person) => {
      if (personIsInGroup(person, groupName)) {
        grouped[groupName].push(person)
        used.push(person)
      }
    })
  })
  grouped["rest"] = people.filter((person) => !used.includes(person))
  return grouped
}

/**
 * Boolean on whether the given position name appears in the list of positions for an individual person
 */
export function personHasPositionStartingWith(
  person: PersonLike,
  positionName: string,
) {
  return (
    !!person.positions &&
    person.positions.some(
      (pos) =>
        pos.slice(0, positionName.length).toLowerCase() ===
        positionName.toLowerCase(),
    )
  )
}

/**
 * Sorts people by board membership, board positions of note, then name.
 * Non-board members come first.
 */
export function sortPeople(arrayOfPeople: YamlPerson[]) {
  return arrayOfPeople.slice(0).sort(function (a, b) {
    const aBoard = (a.groups || []).includes("board")
    const bBoard = (b.groups || []).includes("board")
    const aExtra = (a.groups || []).includes("additional")
    const bExtra = (b.groups || []).includes("additional")

    if (aBoard === bBoard && aExtra === bExtra) {
      if (aBoard) {
        // if both people are on the board, we need to put people with positions first in the list
        const aIsPres = personHasPositionStartingWith(a, "president")
        const bIsPres = personHasPositionStartingWith(b, "president")
        const aIsVice = personHasPositionStartingWith(a, "vice")
        const bIsVice = personHasPositionStartingWith(b, "vice")
        if (aIsPres) return -1
        if (bIsPres) return 1
        if (aIsVice) return -1
        if (bIsVice) return 1
      }

      // sort by name
      const aName = a.last_name + a.first_name
      const bName = b.last_name + b.first_name
      if ([aName, bName].sort().shift() === aName) return -1
      return 1
    } else {
      // sort extras to the end
      // sort by board membership to the end
      if (aBoard) return 1
      if (bBoard) return -1
      if (aExtra) return 1
      if (bExtra) return -1
    }
  })
}

export function lowerFirst(str: string) {
  return str.charAt(0).toLowerCase() + str.substr(1)
}

export function toCamel(str: string) {
  return lowerFirst(str).replace(/([-_\s]\w)/g, (_full, [_, letter]) =>
    letter.toUpperCase(),
  )
}

export function objPropsToCamel(obj: IHash<unknown>) {
  return Object.keys(obj).reduce((acc, current) => {
    if (typeof current !== "string") return acc
    acc[toCamel(current)] = obj[current]
  }, {})
}

export function slugify(str: string) {
  return str.replace(/[^A-Za-z]/g, "-")
}

/**
 * Where start and end dates are inclusive. Each date must be "mm/dd/yyy". If no
 * compareDateStr is given, today is used.
 */
export function dateIsBetween(
  startDateStr: string,
  endDateStr: string,
  compareDateStr?: string,
) {
  const compareDate_ = compareDateStr ? new Date(compareDateStr) : new Date()
  const compareDate = compareDate_.setHours(0, 0, 0, 0)
  const startDate = new Date(startDateStr).setHours(0, 0, 0, 0)
  const endDate = new Date(endDateStr).setHours(0, 0, 0, 0)
  return compareDate <= endDate && compareDate >= startDate
}
