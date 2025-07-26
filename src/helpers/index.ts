import type { Person } from "$models/Person"

type PersonLike = Person | YamlPerson
export function personIsInGroup(person: PersonLike, groupName: string) {
	return !!(
		Array.isArray(person.groups) &&
		person.groups.map((x) => x.toLowerCase()).includes(groupName.toLowerCase())
	)
}

export function isOnlyActing(person: YamlPerson) {
	return person.roles && !person.positions && !person.staff_positions?.length
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

function peopleSortFn(a: YamlPerson, b: YamlPerson) {
	const aName = (a.sort_name || "") + a.last_name + a.first_name
	const bName = (b.sort_name || "") + b.last_name + b.first_name
	return aName.localeCompare(bName)
}

/**
 * Sorts people by board membership, board positions of note, then name.
 * Non-board members come first.
 */
export function sortPeople(arrayOfPeople: YamlPerson[]) {
	return arrayOfPeople.slice(0).sort(peopleSortFn)
}

const boardPositions = ["President", "Vice President", "Secretary", "Treasurer"]

function hasSortablePosition(person: YamlPerson) {
	return (
		!!person.positions &&
		person.positions.some((x) => boardPositions.some((b) => x.startsWith(b)))
	)
}

/**
 * Sorts board members who have positions to the front of the line, by position,
 * then by name.
 */
export function sortBoardMembers(arrayOfPeople: YamlPerson[]) {
	return arrayOfPeople.slice(0).sort((a, b) => {
		if (!hasSortablePosition(a) && !hasSortablePosition(b)) {
			return peopleSortFn(a, b)
		}

		if ((a.positions?.length || 0) === 0) return 1
		if ((b.positions?.length || 0) === 0) return -1

		const aPos = boardPositions.findIndex((x) =>
			a.positions?.[0]?.startsWith(x),
		)
		const bPos = boardPositions.findIndex((x) =>
			b.positions?.[0]?.startsWith(x),
		)

		return aPos - bPos
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
		return acc
	}, {} as IHash<unknown>)
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

/**
 * Expects a YYYY-MM-DD and returns the friendly, `M d, YYYY` format. Optional weekday
 */
export function formatDate(
	dateStr: string,
	options: { prependWeekday?: boolean; skipYear?: boolean } = {},
) {
	const [year, month, day] = dateStr.split("-")
	const date = new Date()
	date.setFullYear(Number(year))
	date.setMonth(Number(month) - 1)
	date.setDate(Number(day))

	const settings: Parameters<Date["toLocaleDateString"]>[1] = {
		weekday: options.prependWeekday ? "long" : undefined,
		year: options.skipYear ? undefined : "numeric",
		month: "long",
		day: "numeric",
	}

	return date.toLocaleDateString("en-US", settings)
}

/**
 * Ensure that when the value is coerced into a string, that the string never
 * says "undefined", "NaN", "null"
 */
export function nonValueToEmptyStr<T>(x: T) {
	if (Number.isNaN(x)) return ""
	if (x === null) return ""
	if (typeof x === "undefined") return ""
	return x
}

/**
 * Returns today as a Date at midnight
 */
export function getToday() {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return today
}

/**
 * Get an actual Date for the string "YYYY-MM-DD". Midnight.
 * @param str
 * @returns
 */
export function getDateFor(str: string, opts: { preserveTime?: boolean } = {}) {
	const [y, m, d] = str.split("-").map(Number) as [number, number, number]
	const today = opts.preserveTime ? new Date() : getToday()
	const mutableDate = new Date(today.getTime())
	mutableDate.setFullYear(y)
	mutableDate.setMonth(m - 1)
	mutableDate.setDate(d)
	return mutableDate
}

/**
 * The number of days from date A to date B. The order matters. If date B is in
 * the past, the result will be negative. Zero means date B and A are the same.
 */
export function diffDays(a: Date, b: Date) {
	const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds

	return Math.round((b.getTime() - a.getTime()) / oneDay)
}

export function assert<T>(
	x: T,
	message = "",
): asserts x is Exclude<T, undefined | null> {
	if (x === undefined || x === null)
		throw new Error(`Assertion failed! ${message}`)
}

export function asserted<T>(x: T, message = "") {
	assert(x, message)
	return x
}

/** only lowercase letters allowed */
export function sanitizedPassphrase(str: string | undefined | null) {
	assert(str)
	return str
		.replace(/[^A-Za-z]/g, "")
		.toLowerCase()
		.trim()
}

/**
 * Like Object.keys, but unsound in exchange for more convenience.
 *
 * Casts the result of Object.keys to the known keys of an object type, even
 * though JavaScript objects may contain additional keys.
 *
 * Only use this function when you know/control the provenance of the object
 * you're iterating, and can verify it contains exactly the keys declared to the
 * type system.
 *
 * NOTE: Objects also convert numbers to strings if they are keys, but TS
 * doesn't do that, so this function returns a `never` type if your object has
 * numerical keys.
 *
 * Example:
 * ```
 * const o = {x: "ok", y: 10}
 * o["z"] = "UNTRACKED_KEY"
 * const safeKeys = Object.keys(o)
 * const convenientKeys = objectKeys(o)
 * ```
 * => const safeKeys: string[] => const convenientKeys: ("x" | "y")[] // Missing "z"
 */
export const objectKeys = Object.keys as <T>(
	obj: T,
) => Array<`${Exclude<keyof T, symbol>}`>

/**
 * Like Object.values, but unsound in exchange for more convenience.
 *
 * Casts the result of Object.values to the known values of an object type,
 * even though JavaScript objects may contain additional values.
 *
 * Only use this function when you know/control the provenance of the object
 * you're iterating, and can verify it contains exactly the values declared
 * to the type system.
 *
 * Example:
 * ```
 * const o = {x: "ok", y: 10} as const
 * o["z"] = "UNTRACKED_VALUE" // This is also a type error, but you get the idea
 * const safeValues = Object.values(o)
 * const convenientValues = objectValues(o)
 * ```
 * => const safeValues: (string | number)[]
 * => const convenientValues: ("ok" | 10)[] // Actually contains "UNTRACKED_VALUE"!
 */
export const objectValues = Object.values as <T>(obj: T) => Array<T[keyof T]>

/**
 * The type of a single item in `Object.entries<T>(value: T)`.
 *
 * Example:
 * ```
 * interface T {x: string; y: number}
 * type T2 = ObjectEntry<T>
 * ```
 * => type T2 = ["x", string] | ["y", number]
 */
export type ObjectEntry<T> = {
	// Without Exclude<keyof T, undefined>, this type produces `ExpectedEntries | undefined`
	// if T has any optional keys.
	[K in Exclude<keyof T, undefined>]: [K, T[K]]
}[Exclude<keyof T, undefined>]

/**
 * Like Object.entries, but returns a more specific type which can be less safe.
 *
 * @example
 * ```
 * const o = {x: "ok", y: 10}
 * const safeEntries = Object.entries(o)
 * const convenientEntries = objectEntries(o)
 * ```
 * => const safeEntries: [string, string | number][]
 * => const convenientEntries: ObjectEntry<{
 *   x: string;
 *   y: number;
 * }>[]
 *
 * See `ObjectEntry` above.
 *
 * Note that Object.entries collapses all possible values into a single union
 * while objectEntries results in a union of 2-tuples.
 */
export const objectEntries = Object.entries as <T>(
	o: T,
) => Array<ObjectEntry<T>>

type InvertedObjectEntry<T extends Record<string, string>> = {
	[K in keyof T]-?: [T[K], K]
}[keyof T]

/**
 * Inverts an object with string values.
 *
 * @example
 * const obj = {x: "ok", y: "no"} as const
 * const inverted = invertObject(obj)
 * // {ok: "x"; no: "y"}
 */
export function invertObject<const T extends Record<string, string>>(obj: T) {
	return fromEntries(
		objectEntries(obj).map(([k, v]) => [v, k]) as Array<InvertedObjectEntry<T>>,
	)
}

/**
 * Like Object.fromEntries, but with better type inference.
 *
 * @example
 * ```
 * const entries = [["x", "ok"], ["y", 10]] as const
 * const puntOnTypes = Object.fromEntries(entries)
 * const exactType = fromEntries(entries)
 * ```
 * => const puntOnTypes: any
 * => const exactType: {x: "ok"; y: 10}
 */
export const fromEntries = <
	const T extends ReadonlyArray<readonly [PropertyKey, unknown]>,
>(
	entries: T,
): { [K in T[number] as K[0]]: K[1] } =>
	Object.fromEntries(entries) as { [K in T[number] as K[0]]: K[1] }

/**
 * Rebuilds an object by applying a function to each entry.
 *
 * This is not type safe, but it is close. You'll still want to carefully cast
 * the result in most cases (if you care). The main reason to use this is to
 * simplify the call site for readability.
 *
 * @example
 * ```
 * const obj = {x: "ok", y: 10}
 * const newObj = rebuildObject(obj, ([k, v]) => [k+1, v + 1])
 * // {x1: "ok1", y1: 11}
 * ```
 */
export function rebuildObject<
	T extends Record<string, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Fn extends (entry: ObjectEntry<T>) => [string | number | symbol, any],
>(
	obj: T,
	fn: Fn,
): Fn extends (entry: ObjectEntry<T>) => [infer K, infer V]
	? K extends string | number | symbol
		? Record<K, V>
		: never
	: never {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return fromEntries(objectEntries(obj).map(fn)) as any
}

export function exists<T>(x: T): x is NonNullable<typeof x> {
	return x !== undefined && x !== null
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ensureArray<T>(
	value: T,
): T extends any[] | undefined
	? Exclude<T, undefined>
	: Array<Exclude<T, undefined>> {
	if (value === undefined) return [] as any
	if (Array.isArray(value)) return value as any
	return [value] as any
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function fullSeasonImageUrl(season: string | number) {
	const year = season.toString().trim()
	let file = "full-season.jpg"

	if (year === "2024") {
		file = "full-season-1.jpg"
	}

	return `/images/${year}/${file}`
}
