import { readdir } from "node:fs/promises"
import { extname, join, relative } from "node:path"
import {
	hasHistoricalPerson,
	historicalPersonPicture,
} from "./historical-images"

const imageExtensions = new Set([".jpg", ".jpeg", ".png"])
const approvalCache = new Map<string, Promise<ReadonlySet<string>>>()

async function loadApprovedHeadshotIds(
	root: string,
): Promise<ReadonlySet<string>> {
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
	return new Set(ids.sort())
}

function approvalSet(root: string): Promise<ReadonlySet<string>> {
	const approved = approvalCache.get(root) ?? loadApprovedHeadshotIds(root)
	approvalCache.set(root, approved)
	return approved
}

export function clearApprovedHeadshotCache(): void {
	approvalCache.clear()
}

export async function approvedHeadshotIds(
	root = "src/images/people",
): Promise<string[]> {
	return [...(await approvalSet(root))]
}

export async function approvedHistoricalHeadshot(id: string) {
	if (!/^[0-9]{4}\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) return
	if (!hasHistoricalPerson(id)) return
	if (!(await approvalSet("src/images/people")).has(id)) return
	return { id, picture: historicalPersonPicture(id)! }
}
