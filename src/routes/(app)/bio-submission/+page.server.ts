import { approvedHeadshotIds } from "$lib/server/bio-headshots"

export const prerender = true

export async function load() {
	return {
		imageFiles: await approvedHeadshotIds(),
	}
}
