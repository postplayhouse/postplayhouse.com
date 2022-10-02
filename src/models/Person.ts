import { toCamel } from "$helpers"

class Person {
  firstName: string
  lastName: string
  sortName: string
  imageYear: number
  imageFile: string
  location: string
  lobbyDisplay?: boolean
  bio: string
  bioApproved: boolean
  programBio: string | undefined
  groups: string[]
  positions: string[]
  staffPositions: string[]

  // TODO: there is a better type here...
  productionPositions: Array<{ productionName: string; positions: string[] }>
  roles: Array<{ productionName: string; positions: string[] }>

  get id() {
    return this.firstName + this.lastName + this.location
  }

  get name() {
    return `${this.firstName} ${this.lastName}`
  }

  get slug() {
    return this.name.toLowerCase().replace(/[^a-z]/g, "-")
  }

  get image() {
    return this.imageYear
      ? `/images/people/${this.imageYear}/${
          this.imageFile ||
          this.name.replace(/\W+/g, "-").toLowerCase() + ".jpg"
        }`
      : undefined
  }

  constructor(personLike: YamlPerson | Person) {
    this.imageFile = undefined
    this.imageYear = 0
    this.firstName = undefined
    this.lastName = undefined
    this.sortName = undefined
    this.location = undefined
    this.lobbyDisplay = undefined
    this.programBio = undefined
    this.bio = ""
    this.bioApproved = false
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

export function toPerson(personLike: YamlPerson | Person) {
  return new Person(personLike)
}

type Person_ = Person

export type { Person_ as Person }
