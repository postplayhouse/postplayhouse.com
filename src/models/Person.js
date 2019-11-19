import { toCamel } from "../helpers"

class Person {
  get name() {
    return `${this.firstName} ${this.lastName}`
  }

  get image() {
    return this.imageYear
      ? `/images/people/${this.imageYear}/${this.imageFile ||
          this.name.replace(/ /g, "-").toLowerCase() + ".jpg"}`
      : undefined
  }

  constructor(personLike) {
    this.imageFile = undefined
    this.imageYear = 0
    this.firstName = undefined
    this.lastName = undefined
    this.location = undefined
    this.bio = ""
    this.groups = []

    // string arrays
    this.positions = []
    this.staffPositions = []

    // Object arrays
    this.productionPositions = []
    this.roles = []

    if (personLike) {
      const thisKeys = Object.keys(this)
      Object.keys(personLike).forEach((key) => {
        const camelKey = toCamel(key)
        if (thisKeys.includes(camelKey)) {
          if (["productionPositions", "roles"].includes(camelKey)) {
            // these are objects that need some adjustment. The properties are actually show names
            this[camelKey] = Object.keys(personLike[key]).reduce(
              (acc, currentKey) => {
                return [
                  ...acc,
                  {
                    productionName: currentKey,
                    positions: [].concat(personLike[key][currentKey]),
                  },
                ]
              },
              [],
            )
          } else {
            if (personLike[key] != null) this[camelKey] = personLike[key]
          }
        }
      })
    }
  }
}

export function toPerson(personLike) {
  return new Person(personLike)
}
