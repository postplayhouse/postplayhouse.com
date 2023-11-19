import type { ShowingsData } from "./showingsData"

type Years<T> = Record<number, T>
type Months<T> = Record<number, T>
type Days<T> = Record<number, T>

export type Agenda = Years<
	Months<
		Days<
			Array<{
				slot: number
				id: string
			}>
		>
	>
>

function getOrAdd<T, K extends keyof T>(
	obj: T,
	property: K,
	lazyDefault: () => T[K],
): T[K] {
	if (obj[property] === undefined) obj[property] = lazyDefault()
	return obj[property]
}

function newObj() {
	return {}
}
function newArr() {
	return []
}

export function createAgenda(
	performances: ShowingsData["performances"],
): Agenda {
	const agenda: Agenda = {}

	for (const { id, slot, ...date } of performances) {
		const year = getOrAdd(agenda, date.year, newObj)
		const month = getOrAdd(year, date.month, newObj)
		const day = getOrAdd(month, date.day, newArr)

		day.push({ id, slot })
	}

	return agenda
}
