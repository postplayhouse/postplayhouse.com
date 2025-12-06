import { asserted, ensureArray, objectKeys, toCamel } from "$helpers"

class Person {
	firstName: string
	lastName: string
	sortName?: string
	imageYear: number
	imageFile?: string
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
		return `${this.firstName} ${this.lastName}`.trim()
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

	constructor(personLike: YamlPerson) {
		this.imageFile = undefined
		this.imageYear = 0
		// @ts-expect-error // Will be set below.
		this.firstName = undefined
		// @ts-expect-error // Will be set below.
		this.lastName = undefined
		this.sortName = undefined
		// @ts-expect-error // Will be set below.
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
			objectKeys(personLike).forEach((key) => {
				const camelKey = toCamel(key) as keyof Person
				if (thisKeys.includes(camelKey)) {
					if (["productionPositions", "roles"].includes(camelKey)) {
						const value = asserted(
							personLike[key as "production_positions" | "roles"],
						)
						// these are objects that need some adjustment. The properties are actually show names
						this[camelKey as "productionPositions" | "roles"] = Object.keys(
							value,
						).reduce(
							(acc, currentKey) => {
								return [
									...acc,
									{
										productionName: currentKey,
										// ensureArray because 2019 and prior have strings as the
										// roles[n].positions type. After 2019, it's an array.
										//
										// Shoulda used Zod or something when going from Yaml to TS.
										positions: ensureArray(value[currentKey]) || [],
									},
								]
							},
							[] as (typeof this)["roles" | "productionPositions"],
						)
					} else {
						if (personLike[key] != null)
							this[camelKey as "firstName"] = personLike[key] as string
					}
				}
			})
		}
	}
}

export function toPerson(personLike: YamlPerson | Person) {
	return personLike instanceof Person ? personLike : new Person(personLike)
}

type Person_ = Person

export type { Person_ as Person }
