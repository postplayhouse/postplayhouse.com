export function personIsInGroup(person, groupName) {
  return !!person.groups.includes(groupName)
}

export function personIsOnlyInGroup(person, groupName) {
  return personIsInGroup(person, groupName) && person.groups.length === 1
}

/**
 * Boolean on whether the given position name appears in the list of positions for an individual person
 * @param {object} person
 * @param {string} positionName
 */
export function personHasPositionStartingWith(person, positionName) {
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
 * @param {Array<object>} arrayOfPeople
 */
export function sortPeople(arrayOfPeople) {
  return arrayOfPeople.slice(0).sort(function(a, b) {
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

export function lowerFirst(str) {
  return str.charAt(0).toLowerCase() + str.substr(1)
}

export function toCamel(str) {
  return lowerFirst(str).replace(/([-_\s]\w)/g, (_full, [_, letter]) =>
    letter.toUpperCase(),
  )
}

export function objPropsToCamel(obj) {
  return Object.keys(obj).reduce((acc, current) => {
    if (typeof current !== "string") return acc
    acc[toCamel(current)] = obj[current]
  }, {})
}
