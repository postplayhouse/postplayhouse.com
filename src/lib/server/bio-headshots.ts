import { readdir } from "node:fs/promises"
import { extname, join, relative } from "node:path"
import {
	hasHistoricalPerson,
	historicalPersonPicture,
} from "./historical-images"

const imageExtensions = new Set([".jpg", ".jpeg", ".png"])

export async function approvedHeadshotIds(
	root = "src/images/people",
): Promise<string[]> {
	const ids: string[] = []
	async function visit(directory: string) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name)
			if (entry.isDirectory()) await visit(path)
			else if (imageExtensions.has(extname(entry.name).toLowerCase()))
				ids.push(relative(root, path).replaceAll("\\", "/"))
		}
	}
	await visit(root)
	return ids.sort()
}

export async function approvedHistoricalHeadshot(id: string) {
	if (!/^[0-9]{4}\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) return
	if (!hasHistoricalPerson(id)) return
	if (!(await approvedHeadshotIds()).includes(id)) return
	return { id, picture: historicalPersonPicture(id)! }
}
