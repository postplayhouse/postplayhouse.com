import data from "$data/_yaml"
import type { BioGroup } from "$lib/bios"

export function checkedInGroups(season: number, position: number): BioGroup[] {
	const people = data.people[String(season) as keyof typeof data.people]
	return people?.[position - 1]?.groups ?? []
}
