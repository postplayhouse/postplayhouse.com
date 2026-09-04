import { season } from "$data/seasons"

export function match(param: string): boolean {
	return param === String(season)
}
