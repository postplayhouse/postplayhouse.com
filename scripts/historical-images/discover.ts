import { readdir, stat } from "node:fs/promises"
import { extname, join, relative, sep } from "node:path"
import type { ArtifactConfig, ArtifactSourceDirectory } from "./config"
import { hashFile } from "./hash"

export interface DiscoveredSource {
	path: string
	logicalPath: string
	sourceId: string
	collection: string
	bytes: number
	sha256: string
	profile: string
}

async function walk(
	directory: string,
	source: ArtifactSourceDirectory,
): Promise<string[]> {
	const result: string[] = []
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name)
		if (entry.isDirectory() && source.recursive)
			result.push(...(await walk(path, source)))
		else if (
			entry.isFile() &&
			source.extensions.includes(extname(entry.name).slice(1))
		)
			result.push(path)
	}
	return result
}

async function describe(
	root: string,
	source: ArtifactSourceDirectory,
): Promise<DiscoveredSource[]> {
	const directory = join(root, source.directory)
	const sources: DiscoveredSource[] = []
	let paths: string[]
	try {
		paths = await walk(directory, source)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT")
			throw new Error(
				`Configured artifact source directory does not exist: ${source.directory}`,
				{ cause: error },
			)
		throw error
	}
	for (const path of paths.sort()) {
		const details = await stat(path)
		const relativePath = relative(directory, path).split(sep).join("/")
		sources.push({
			path: relative(root, path).split(sep).join("/"),
			logicalPath: `${source.logicalPrefix}${relativePath}`,
			sourceId: source.id,
			collection: source.collection,
			bytes: details.size,
			sha256: await hashFile(path),
			profile: source.profile,
		})
	}
	return sources
}

export async function discoverArtifactSources(
	root: string,
	config: ArtifactConfig,
): Promise<DiscoveredSource[]> {
	const result = (
		await Promise.all(config.sources.map((source) => describe(root, source)))
	).flat()
	for (const exception of config.profileExceptions) {
		const match = result.find(
			(source) =>
				source.sourceId === exception.sourceId &&
				source.logicalPath === exception.logicalPath,
		)
		if (!match)
			throw new Error(
				`Required artifact profile exception is missing: ${exception.sourceId}:${exception.logicalPath}`,
			)
		result.push({
			...match,
			profile: exception.profile,
			collection: exception.collection,
		})
	}
	const generatedKeys = new Set<string>()
	for (const source of result) {
		const key = `${source.collection}\0${source.logicalPath}`
		if (generatedKeys.has(key))
			throw new Error(
				`Duplicate generated metadata path: ${source.collection}:${source.logicalPath}`,
			)
		generatedKeys.add(key)
	}
	return result.sort((left, right) =>
		`${left.path}\0${left.profile}`.localeCompare(
			`${right.path}\0${right.profile}`,
		),
	)
}
