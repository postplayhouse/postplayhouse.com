import { readdir, stat } from "node:fs/promises"
import { extname, join, relative, sep } from "node:path"
import { CURRENT_SEASON, imageExtensions, profiles } from "./config"
import { hashFile } from "./hash"

export interface DiscoveredSource {
	path: string
	bytes: number
	sha256: string
	profile: string
}

async function walk(directory: string): Promise<string[]> {
	const result: string[] = []
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) result.push(...(await walk(path)))
		else if (entry.isFile() && imageExtensions.has(extname(entry.name)))
			result.push(path)
	}
	return result
}

async function describe(
	root: string,
	paths: string[],
	profile: string,
): Promise<DiscoveredSource[]> {
	const sources: DiscoveredSource[] = []
	for (const path of paths.sort()) {
		const details = await stat(path)
		sources.push({
			path: relative(root, path).split(sep).join("/"),
			bytes: details.size,
			sha256: await hashFile(path),
			profile,
		})
	}
	return sources
}

export async function discoverHistoricalSources(
	root = process.cwd(),
): Promise<DiscoveredSource[]> {
	const peopleRoot = join(root, "src/images/people")
	const seasonsRoot = join(root, "src/images/seasons")
	const people = (await walk(peopleRoot)).filter(
		(path) => !path.startsWith(join(peopleRoot, String(CURRENT_SEASON), sep)),
	)
	const seasons = (await walk(seasonsRoot)).filter(
		(path) => !path.startsWith(join(seasonsRoot, String(CURRENT_SEASON), sep)),
	)
	const result = [
		...(await describe(root, people, profiles.people.id)),
		...(await describe(root, seasons, profiles.season.id)),
	]
	for (const path of [
		"src/images/people/2018/ken-phillips.jpg",
		"src/images/people/2016/dewayne-barrett.jpg",
	]) {
		const match = result.find((source) => source.path === path)
		if (!match)
			throw new Error(
				`Required direct historical profile source is missing: ${path}`,
			)
		result.push({ ...match, profile: profiles.raffle.id })
	}
	return result.sort((left, right) =>
		`${left.path}\0${left.profile}`.localeCompare(
			`${right.path}\0${right.profile}`,
		),
	)
}
