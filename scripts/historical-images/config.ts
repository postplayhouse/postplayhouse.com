import { join } from "node:path"

export type ArtifactQueryValue = string | boolean

export interface ArtifactProfile {
	query: Readonly<Record<string, ArtifactQueryValue>>
	srcsetDescriptors: "width" | "density"
}

export interface ArtifactSourceDirectory {
	id: string
	directory: string
	logicalPrefix: string
	profile: string
	collection: string
	extensions: readonly string[]
	recursive?: boolean
}

export interface ArtifactProfileException {
	sourceId: string
	logicalPath: string
	profile: string
	collection: string
}

export interface ArtifactConfig {
	identity: string
	legacyCurrentSeason?: number
	schemaVersion: 1
	generatorRevision: number
	profileConfigurationSha256?: string
	storePrefix: string
	lockPath: string
	generatedMetadataPath: string
	staticAssetRoot: string
	cacheRoot: string
	publicAssetPrefix: string
	trustedPublishCommand: string
	profiles: Readonly<Record<string, ArtifactProfile>>
	sources: readonly ArtifactSourceDirectory[]
	profileExceptions: readonly ArtifactProfileException[]
}

export interface ArtifactConfigProvider {
	load(
		root: string,
		options?: { allowGeneratedOutputsToBeStale?: boolean },
	): Promise<ArtifactConfig>
	afterGenerate?(root: string): Promise<void>
}

const safeRelativePath = (value: string): boolean =>
	value.length > 0 &&
	!value.startsWith("/") &&
	!value.includes("\\") &&
	!value.split("/").includes("..")

export function validateArtifactConfig(config: ArtifactConfig): ArtifactConfig {
	if (!config.identity.trim())
		throw new Error("Artifact config identity is required")
	for (const [label, value] of [
		["storePrefix", config.storePrefix],
		["lockPath", config.lockPath],
		["generatedMetadataPath", config.generatedMetadataPath],
		["staticAssetRoot", config.staticAssetRoot],
		["cacheRoot", config.cacheRoot],
	] as const)
		if (!safeRelativePath(value))
			throw new Error(`Artifact config ${label} must be a safe relative path`)
	if (
		!config.publicAssetPrefix.startsWith("/") ||
		!config.publicAssetPrefix.endsWith("/")
	)
		throw new Error(
			"Artifact config publicAssetPrefix must start and end with /",
		)
	if (
		config.profileConfigurationSha256 &&
		(config.profileConfigurationSha256.length !== 64 ||
			[...config.profileConfigurationSha256].some(
				(character) => !"0123456789abcdef".includes(character),
			))
	)
		throw new Error(
			"Artifact config profileConfigurationSha256 must be a SHA-256",
		)

	const sourceIds = new Set<string>()
	const collections = new Set<string>()
	for (const source of config.sources) {
		if (sourceIds.has(source.id))
			throw new Error(`Duplicate artifact source id: ${source.id}`)
		sourceIds.add(source.id)
		if (!safeRelativePath(source.directory))
			throw new Error(`Unsafe artifact source directory: ${source.directory}`)
		if (
			source.logicalPrefix.startsWith("/") ||
			source.logicalPrefix.includes("\\") ||
			source.logicalPrefix.split("/").includes("..")
		)
			throw new Error(`Unsafe artifact logical prefix: ${source.logicalPrefix}`)
		if (!config.profiles[source.profile])
			throw new Error(
				`Unknown artifact profile ${source.profile} for ${source.id}`,
			)
		if (!/^[A-Za-z_$][\w$]*$/.test(source.collection))
			throw new Error(`Invalid generated collection name: ${source.collection}`)
		collections.add(source.collection)
		if (source.extensions.length === 0)
			throw new Error(`Artifact source ${source.id} must configure extensions`)
		for (const extension of source.extensions)
			if (!extension || extension.startsWith(".") || extension.includes("/"))
				throw new Error(`Invalid extension ${extension} for ${source.id}`)
	}
	const exceptions = new Set<string>()
	for (const exception of config.profileExceptions) {
		if (!sourceIds.has(exception.sourceId))
			throw new Error(`Unknown exception source id: ${exception.sourceId}`)
		if (!config.profiles[exception.profile])
			throw new Error(`Unknown exception profile: ${exception.profile}`)
		if (!safeRelativePath(exception.logicalPath))
			throw new Error(
				`Unsafe artifact exception logical path: ${exception.logicalPath}`,
			)
		if (!/^[A-Za-z_$][\w$]*$/.test(exception.collection))
			throw new Error(
				`Invalid generated collection name: ${exception.collection}`,
			)
		collections.add(exception.collection)
		const key = `${exception.sourceId}\0${exception.logicalPath}\0${exception.profile}`
		if (exceptions.has(key))
			throw new Error(`Duplicate profile exception: ${key}`)
		exceptions.add(key)
	}
	if (collections.size === 0)
		throw new Error(
			"Artifact config must define at least one metadata collection",
		)
	return config
}

export function objectName(config: ArtifactConfig, sha256: string): string {
	return `${config.storePrefix}/objects/${sha256}`
}

export function manifestName(config: ArtifactConfig, sha256: string): string {
	return `${config.storePrefix}/manifests/${sha256}.json`
}

export function latestName(config: ArtifactConfig): string {
	return `${config.storePrefix}/latest.json`
}

export function cacheObjectPath(
	config: ArtifactConfig,
	root: string,
	sha256: string,
): string {
	return join(root, config.cacheRoot, "objects", sha256)
}
