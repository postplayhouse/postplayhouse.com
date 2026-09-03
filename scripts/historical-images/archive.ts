import {
	lstat,
	mkdir,
	open,
	readFile,
	rename,
	rm,
	stat,
	writeFile,
} from "node:fs/promises"
import { dirname, join } from "node:path"
import {
	cacheObjectPath,
	latestName,
	manifestName,
	objectName,
	type ArtifactConfig,
} from "./config"
import { deriveCompatibility, derivePipelineSha256 } from "./compatibility"
import { discoverArtifactSources } from "./discover"
import { hashFile, sha256, stableJson } from "./hash"
import { generatedMap } from "./metadata"
import {
	lockSchema,
	manifestSchema,
	type HistoricalLock,
	type HistoricalManifest,
} from "./schema"
import type { ArtifactStore } from "./store"

function artifactRelativePaths(
	config: ArtifactConfig,
	publicPath: string,
): { encoded: string; decoded: string } {
	if (!publicPath.startsWith(config.publicAssetPrefix))
		throw new Error(
			`artifact public path is outside configured prefix: ${publicPath}`,
		)
	const encoded = publicPath.slice(config.publicAssetPrefix.length)
	const decoded = decodeURIComponent(encoded)
	if (
		decoded.startsWith("/") ||
		decoded.includes("\\") ||
		decoded.split("/").includes("..")
	)
		throw new Error(`unsafe historical image public path: ${publicPath}`)
	return { encoded, decoded }
}

function restoredAssetPath(config: ArtifactConfig, publicPath: string): string {
	return artifactRelativePaths(config, publicPath).decoded
}

export interface PublishResult {
	lock: HistoricalLock
	objectsCreated: number
	objectsReused: number
	bytesUploaded: number
}

async function mapConcurrent<T>(
	items: T[],
	concurrency: number,
	operation: (item: T) => Promise<void>,
): Promise<void> {
	let next = 0
	let failed = false
	let firstError: unknown
	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, async () => {
			while (!failed && next < items.length) {
				try {
					await operation(items[next++])
				} catch (error) {
					failed = true
					firstError = error
				}
			}
		}),
	)
	if (failed) throw firstError
}

function manifestBody(manifest: HistoricalManifest): Buffer {
	return Buffer.from(`${JSON.stringify(manifest)}\n`)
}

function sourceProfileKey(source: { path: string; profile: string }): string {
	return `${source.path} [${source.profile}]`
}

export function sourceSetSha256(manifest: HistoricalManifest): string {
	return sha256(
		stableJson(
			manifest.sources.map(({ path, profile, sha256 }) => ({
				path,
				profile,
				sha256,
			})),
		),
	)
}

async function generatedOutputs(
	root: string,
	config: ArtifactConfig,
): Promise<NonNullable<HistoricalLock["generatedOutputs"]>> {
	return Object.fromEntries(
		await Promise.all(
			[...config.generatedOutputPaths].sort().map(async (path) => {
				const file = join(root, path)
				return [
					path,
					{ bytes: (await stat(file)).size, sha256: await hashFile(file) },
				]
			}),
		),
	)
}

export async function replaceFileAtomically(
	path: string,
	body: string | Buffer,
	move: (from: string, to: string) => Promise<void> = rename,
): Promise<void> {
	await mkdir(dirname(path), { recursive: true })
	const temporary = `${path}.${process.pid}.${Date.now()}.tmp`
	try {
		const file = await open(temporary, "wx")
		try {
			await file.writeFile(body)
			await file.sync()
		} finally {
			await file.close()
		}
		await move(temporary, path)
		const directory = await open(dirname(path), "r")
		try {
			await directory.sync()
		} finally {
			await directory.close()
		}
	} finally {
		await rm(temporary, { force: true })
	}
}

async function verifiedAssetBody(
	root: string,
	config: ArtifactConfig,
	store: ArtifactStore | null,
	assetRoot: string,
	asset: HistoricalManifest["assets"][number],
): Promise<Buffer> {
	const local = join(
		assetRoot,
		artifactRelativePaths(config, asset.publicPath).encoded,
	)
	for (const path of [local, cacheObjectPath(config, root, asset.sha256)]) {
		try {
			const body = await readFile(path)
			if (body.length === asset.bytes && sha256(body) === asset.sha256)
				return body
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
		}
	}
	if (!store)
		throw new Error(
			`Artifact is not cached and no read store is available: ${asset.publicPath}`,
		)
	const body = await store.get(objectName(config, asset.sha256))
	if (!body || body.length !== asset.bytes || sha256(body) !== asset.sha256)
		throw new Error(
			`Generated asset is unavailable or invalid: ${asset.publicPath}`,
		)
	return body
}

export function derivePublicationId(
	manifest: Omit<HistoricalManifest, "publicationId">,
): string {
	return sha256(stableJson(manifest))
}

export async function publish(
	root: string,
	config: ArtifactConfig,
	store: ArtifactStore,
	inputManifestPath: string,
	assetRoot: string,
): Promise<PublishResult> {
	await assertOwnedRoot(root, config.cacheRoot)
	const raw = JSON.parse(
		await readFile(inputManifestPath, "utf8"),
	) as HistoricalManifest
	const manifest = manifestSchema.parse(raw)
	verifyManifestConfiguration(config, manifest)
	const actualGeneratedMetadata = await readFile(
		join(root, config.generatedMetadataPath),
		"utf8",
	)
	const expectedGeneratedMetadata = generatedMap(manifest)
	if (actualGeneratedMetadata !== expectedGeneratedMetadata)
		throw new Error(
			`Generated historical metadata does not match the manifest (${sha256(actualGeneratedMetadata)} != ${sha256(expectedGeneratedMetadata)})`,
		)
	const { publicationId: _publicationId, ...publicationContent } = manifest
	const expectedPublicationId = derivePublicationId(publicationContent)
	if (manifest.publicationId !== expectedPublicationId)
		throw new Error(
			"Manifest publicationId does not match its canonical content",
		)

	let objectsCreated = 0
	let objectsReused = 0
	let bytesUploaded = 0
	const uniqueAssets = [
		...new Map(manifest.assets.map((asset) => [asset.sha256, asset])).values(),
	]
	await store.prime?.(
		uniqueAssets.map((asset) => objectName(config, asset.sha256)),
	)
	await mapConcurrent(uniqueAssets, 8, async (asset) => {
		const body = await verifiedAssetBody(root, config, store, assetRoot, asset)
		const result = await store.putImmutable(
			objectName(config, asset.sha256),
			body,
			`image/${asset.format}`,
		)
		if (result === "created") {
			objectsCreated += 1
			bytesUploaded += body.length
		} else objectsReused += 1
	})

	const serialized = manifestBody(manifest)
	const manifestSha256 = sha256(serialized)
	await store.putImmutable(
		manifestName(config, manifestSha256),
		serialized,
		"application/json",
	)
	let previousPublicPaths = new Set<string>()
	let previousSources: HistoricalManifest["sources"] = []
	let existingSummary: HistoricalLock["summary"]
	let previousLockBody: string | undefined
	try {
		previousLockBody = await readFile(join(root, config.lockPath), "utf8")
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
	}
	if (previousLockBody) {
		const previousLock = lockSchema.parse(JSON.parse(previousLockBody))
		const previous = await readVerifiedManifest(
			root,
			config,
			store,
			previousLock,
		)
		previousPublicPaths = new Set(
			previous.assets.map(({ publicPath }) => publicPath),
		)
		previousSources = previous.sources
		if (previousLock.publicationId === manifest.publicationId)
			existingSummary = previousLock.summary
	}
	const publicPaths = new Set(
		manifest.assets.map(({ publicPath }) => publicPath),
	)
	const previousSourcesByKey = new Map(
		previousSources.map((source) => [sourceProfileKey(source), source]),
	)
	const sourcesByKey = new Map(
		manifest.sources.map((source) => [sourceProfileKey(source), source]),
	)
	const lock: HistoricalLock = {
		schemaVersion: 2,
		manifestObject: manifestName(config, manifestSha256),
		manifestSha256,
		manifestBytes: serialized.length,
		publicationId: manifest.publicationId,
		sourceSetSha256: sourceSetSha256(manifest),
		pipelineSha256: await derivePipelineSha256(root, config),
		generatedOutputs: await generatedOutputs(root, config),
		summary: existingSummary ?? {
			sourceProfiles: manifest.sources.length,
			uniqueSources: new Set(manifest.sources.map(({ path }) => path)).size,
			publicPaths: manifest.assets.length,
			uniqueObjects: uniqueAssets.length,
			uniqueBytes: uniqueAssets.reduce(
				(total, asset) => total + asset.bytes,
				0,
			),
			addedPublicPaths: [...publicPaths]
				.filter((path) => !previousPublicPaths.has(path))
				.sort(),
			removedPublicPaths: [...previousPublicPaths]
				.filter((path) => !publicPaths.has(path))
				.sort(),
			addedSourceProfiles: [...sourcesByKey.keys()]
				.filter((key) => !previousSourcesByKey.has(key))
				.sort(),
			removedSourceProfiles: [...previousSourcesByKey.keys()]
				.filter((key) => !sourcesByKey.has(key))
				.sort(),
			changedSourceProfiles: [...sourcesByKey]
				.filter(([key, source]) => {
					const previous = previousSourcesByKey.get(key)
					return (
						previous &&
						(previous.sha256 !== source.sha256 ||
							previous.transformKey !== source.transformKey)
					)
				})
				.map(([key]) => key)
				.sort(),
		},
	}
	await store.putPointer(
		latestName(config),
		Buffer.from(
			`${stableJson({ ...lock, publishedAt: new Date().toISOString() })}\n`,
		),
	)
	await replaceFileAtomically(
		join(root, config.lockPath),
		`${JSON.stringify(lock, null, 2)}\n`,
	)
	return { lock, objectsCreated, objectsReused, bytesUploaded }
}

async function readVerifiedManifest(
	root: string,
	config: ArtifactConfig,
	store: ArtifactStore | null,
	lock: HistoricalLock,
): Promise<HistoricalManifest> {
	await assertOwnedRoot(root, join(config.cacheRoot, "manifests"))
	const cached = join(root, config.cacheRoot, "manifests", lock.manifestSha256)
	let body: Buffer | null = null
	try {
		body = await readFile(cached)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
	}
	if (!body) {
		if (!store)
			throw new Error(
				"verified manifest is not cached and read credentials are unavailable",
			)
		body = await store.get(lock.manifestObject)
		if (!body)
			throw new Error(`manifest object is missing: ${lock.manifestObject}`)
	}
	if (
		body.length !== lock.manifestBytes ||
		sha256(body) !== lock.manifestSha256
	)
		throw new Error("manifest integrity verification failed")
	const manifest = manifestSchema.parse(JSON.parse(body.toString("utf8")))
	if (manifest.publicationId !== lock.publicationId)
		throw new Error("manifest publication does not match the repository lock")
	await mkdir(dirname(cached), { recursive: true })
	await writeFile(cached, body)
	return manifest
}

async function verifyCheckout(
	root: string,
	config: ArtifactConfig,
	manifest: HistoricalManifest,
	lock: HistoricalLock,
): Promise<void> {
	verifyManifestConfiguration(config, manifest)
	const discovered = await discoverArtifactSources(root, config)
	const expected = manifest.sources.map(
		({ path, logicalPath, sourceId, collection, bytes, sha256, profile }) => ({
			path,
			logicalPath,
			sourceId,
			collection,
			bytes,
			sha256,
			profile,
		}),
	)
	const comparableDiscovered = discovered.map((source) => {
		if (manifest.configurationId) return source
		const {
			logicalPath: _logicalPath,
			sourceId: _sourceId,
			collection: _collection,
			...legacy
		} = source
		return legacy
	})
	if (stableJson(comparableDiscovered) !== stableJson(expected))
		throw new Error(
			`artifact source inventory is stale; run ${config.trustedPublishCommand}`,
		)
	if (sourceSetSha256(manifest) !== lock.sourceSetSha256)
		throw new Error(
			"manifest source identity does not match the repository lock",
		)
	if (lock.schemaVersion === 2) {
		if (!lock.pipelineSha256 || !lock.generatedOutputs || !lock.summary)
			throw new Error("artifact v2 lock is missing authenticated build outputs")
		if ((await derivePipelineSha256(root, config)) !== lock.pipelineSha256)
			throw new Error(
				`artifact image pipeline changed; run ${config.trustedPublishCommand}`,
			)
		const actual = await generatedOutputs(root, config)
		if (stableJson(actual) !== stableJson(lock.generatedOutputs))
			throw new Error(
				`generated historical image modules are stale or tampered; run ${config.trustedPublishCommand}`,
			)
	} else if (
		stableJson(await deriveCompatibility(root, config)) !==
		stableJson(manifest.compatibility)
	)
		throw new Error(
			`artifact image pipeline changed; run ${config.trustedPublishCommand}`,
		)
}

async function assertOwnedRoot(
	root: string,
	relative: string,
): Promise<string> {
	let current = root
	for (const part of relative.split("/")) {
		current = join(current, part)
		try {
			if ((await lstat(current)).isSymbolicLink())
				throw new Error(
					`artifact-owned path must not contain symlinks: ${relative}`,
				)
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
		}
	}
	return join(root, relative)
}

async function pruneStaleAssets(
	root: string,
	config: ArtifactConfig,
	current: Set<string>,
	manifestSha256: string,
): Promise<void> {
	const ledger = join(root, config.cacheRoot, "restored-state.json")
	let previous: string[] = []
	try {
		const state = JSON.parse(await readFile(ledger, "utf8")) as {
			manifestSha256?: string
		}
		if (!state.manifestSha256?.match(/^[a-f0-9]{64}$/))
			throw new Error("restored artifact state is invalid")
		const body = await readFile(
			join(root, config.cacheRoot, "manifests", state.manifestSha256),
		)
		if (sha256(body) !== state.manifestSha256)
			throw new Error("restored artifact state manifest is tampered")
		previous = manifestSchema
			.parse(JSON.parse(body.toString("utf8")))
			.assets.map(({ publicPath }) => publicPath)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
	}
	const staticRoot = await assertOwnedRoot(root, config.staticAssetRoot)
	for (const path of previous.filter((path) => !current.has(path))) {
		const relative = restoredAssetPath(config, path)
		await assertOwnedRoot(root, join(config.staticAssetRoot, dirname(relative)))
		const target = join(staticRoot, relative)
		try {
			if ((await lstat(target)).isFile()) await rm(target)
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
		}
	}
	await replaceFileAtomically(ledger, `${JSON.stringify({ manifestSha256 })}\n`)
}

function verifyManifestConfiguration(
	config: ArtifactConfig,
	manifest: HistoricalManifest,
): void {
	const matches = manifest.configurationId
		? manifest.configurationId === config.identity
		: manifest.currentSeason === config.legacyCurrentSeason
	if (!matches)
		throw new Error(
			`artifact manifest configuration does not match ${config.identity}; run ${config.trustedPublishCommand}`,
		)
}

export async function restore(
	root: string,
	config: ArtifactConfig,
	store: ArtifactStore | null,
): Promise<{ restored: number; cached: number; bytesTransferred: number }> {
	let lock: HistoricalLock
	try {
		lock = lockSchema.parse(
			JSON.parse(await readFile(join(root, config.lockPath), "utf8")),
		)
	} catch (error) {
		throw new Error(
			`artifact publication lock is missing or invalid; run ${config.trustedPublishCommand}`,
			{ cause: error },
		)
	}
	await assertOwnedRoot(root, config.cacheRoot)
	await assertOwnedRoot(root, join(config.cacheRoot, "manifests"))
	await assertOwnedRoot(root, join(config.cacheRoot, "objects"))
	await assertOwnedRoot(root, config.staticAssetRoot)
	const manifest = await readVerifiedManifest(root, config, store, lock)
	await verifyCheckout(root, config, manifest, lock)
	let restored = 0
	let cached = 0
	let bytesTransferred = 0
	const needed: HistoricalManifest["assets"] = []
	await mapConcurrent(manifest.assets, 8, async (asset) => {
		const relativeAsset = restoredAssetPath(config, asset.publicPath)
		const target = join(root, config.staticAssetRoot, relativeAsset)
		try {
			if (
				(await stat(target)).size === asset.bytes &&
				(await hashFile(target)) === asset.sha256
			)
				return
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
		}
		needed.push(asset)
	})
	const neededObjects = [
		...new Map(needed.map((asset) => [asset.sha256, asset])).values(),
	]
	await store?.prime?.(
		neededObjects.map((asset) => objectName(config, asset.sha256)),
	)
	await mapConcurrent(neededObjects, 8, async (asset) => {
		const cachePath = cacheObjectPath(config, root, asset.sha256)
		let body: Buffer | null = null
		try {
			body = await readFile(cachePath)
			if (body.length !== asset.bytes || sha256(body) !== asset.sha256)
				body = null
			else cached += 1
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
		}
		if (!body) {
			if (!store)
				throw new Error(
					`artifact is not cached and read credentials are unavailable: ${asset.publicPath}`,
				)
			body = await store.get(objectName(config, asset.sha256))
			if (!body || body.length !== asset.bytes || sha256(body) !== asset.sha256)
				throw new Error(
					`artifact is missing or failed integrity verification: ${asset.publicPath}`,
				)
			bytesTransferred += body.length
			await mkdir(dirname(cachePath), { recursive: true })
			const temporary = `${cachePath}.${process.pid}.tmp`
			await writeFile(temporary, body)
			await rename(temporary, cachePath)
		}
	})
	await mapConcurrent(needed, 8, async (asset) => {
		const relativeAsset = restoredAssetPath(config, asset.publicPath)
		await assertOwnedRoot(
			root,
			join(config.staticAssetRoot, dirname(relativeAsset)),
		)
		const target = join(root, config.staticAssetRoot, relativeAsset)
		const body = await readFile(cacheObjectPath(config, root, asset.sha256))
		await mkdir(dirname(target), { recursive: true })
		const temporary = `${target}.${process.pid}.${sha256(asset.publicPath)}.tmp`
		await writeFile(temporary, body)
		await rename(temporary, target)
		restored += 1
	})
	await pruneStaleAssets(
		root,
		config,
		new Set(manifest.assets.map(({ publicPath }) => publicPath)),
		lock.manifestSha256,
	)
	return { restored, cached, bytesTransferred }
}

export async function prepareGeneration(
	root: string,
	config: ArtifactConfig,
	store: ArtifactStore | null,
	output: string,
): Promise<{ assets: number; bytes: number }> {
	await assertOwnedRoot(root, config.cacheRoot)
	const lock = lockSchema.parse(
		JSON.parse(await readFile(join(root, config.lockPath), "utf8")),
	)
	const manifest = await readVerifiedManifest(root, config, store, lock)
	const uniqueAssets = [
		...new Map(manifest.assets.map((asset) => [asset.sha256, asset])).values(),
	]
	await store?.prime?.(
		uniqueAssets.map((asset) => objectName(config, asset.sha256)),
	)
	let bytes = 0
	await mapConcurrent(manifest.assets, 8, async (asset) => {
		const body = await verifiedAssetBody(
			root,
			config,
			store,
			join(output, "assets"),
			asset,
		)
		const target = join(
			output,
			"assets",
			artifactRelativePaths(config, asset.publicPath).encoded,
		)
		await mkdir(dirname(target), { recursive: true })
		await replaceFileAtomically(target, body)
		bytes += body.length
	})
	await replaceFileAtomically(
		join(output, "manifest.v1.json"),
		manifestBody(manifest),
	)
	return { assets: manifest.assets.length, bytes }
}

export async function clearRestoredAssets(
	root: string,
	config: ArtifactConfig,
): Promise<void> {
	await rm(join(root, config.staticAssetRoot), { recursive: true, force: true })
}
