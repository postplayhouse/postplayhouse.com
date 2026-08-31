import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import sharp from "sharp"
import {
	CACHE_ROOT,
	CURRENT_SEASON,
	LOCK_PATH,
	STATIC_ASSET_ROOT,
	TRUSTED_PUBLISH_COMMAND,
	cacheObjectPath,
	latestName,
	manifestName,
	objectName,
} from "./config"
import { deriveCompatibility } from "./compatibility"
import { discoverHistoricalSources } from "./discover"
import { hashFile, sha256, stableJson } from "./hash"
import {
	lockSchema,
	manifestSchema,
	type HistoricalLock,
	type HistoricalManifest,
} from "./schema"
import type { ArtifactStore } from "./store"

function restoredAssetPath(publicPath: string): string {
	const decoded = decodeURIComponent(
		publicPath.replace(/^\/_app\/immutable\/assets\//, ""),
	)
	if (
		decoded.startsWith("/") ||
		decoded.includes("\\") ||
		decoded.split("/").includes("..")
	)
		throw new Error(`unsafe historical image public path: ${publicPath}`)
	return decoded
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

export function derivePublicationId(
	manifest: Omit<HistoricalManifest, "publicationId">,
): string {
	return sha256(stableJson(manifest))
}

export async function publish(
	root: string,
	store: ArtifactStore,
	inputManifestPath: string,
	assetRoot: string,
): Promise<PublishResult> {
	const raw = JSON.parse(
		await readFile(inputManifestPath, "utf8"),
	) as HistoricalManifest
	const manifest = manifestSchema.parse(raw)
	if (manifest.currentSeason !== CURRENT_SEASON)
		throw new Error(`Manifest current season must be ${CURRENT_SEASON}`)
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
	await mapConcurrent(uniqueAssets, 8, async (asset) => {
		const local = join(
			assetRoot,
			asset.publicPath.replace(/^\/_app\/immutable\/assets\//, ""),
		)
		const details = await stat(local)
		if (
			details.size !== asset.bytes ||
			(await hashFile(local)) !== asset.sha256
		)
			throw new Error(
				`Generated asset does not match manifest: ${asset.publicPath}`,
			)
		const body = await readFile(local)
		const result = await store.putImmutable(
			objectName(asset.sha256),
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
		manifestName(manifestSha256),
		serialized,
		"application/json",
	)
	const lock: HistoricalLock = {
		schemaVersion: 1,
		manifestObject: manifestName(manifestSha256),
		manifestSha256,
		manifestBytes: serialized.length,
		publicationId: manifest.publicationId,
		sourceSetSha256: sha256(
			stableJson(
				manifest.sources.map(({ path, profile, sha256 }) => ({
					path,
					profile,
					sha256,
				})),
			),
		),
	}
	await store.putPointer(
		latestName(),
		Buffer.from(
			`${stableJson({ ...lock, publishedAt: new Date().toISOString() })}\n`,
		),
	)
	await mkdir(dirname(join(root, LOCK_PATH)), { recursive: true })
	await writeFile(join(root, LOCK_PATH), `${stableJson(lock)}\n`)
	return { lock, objectsCreated, objectsReused, bytesUploaded }
}

async function readVerifiedManifest(
	root: string,
	store: ArtifactStore | null,
	lock: HistoricalLock,
): Promise<HistoricalManifest> {
	const cached = join(root, CACHE_ROOT, "manifests", lock.manifestSha256)
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
	manifest: HistoricalManifest,
): Promise<void> {
	const discovered = await discoverHistoricalSources(root)
	const expected = manifest.sources.map(({ path, bytes, sha256, profile }) => ({
		path,
		bytes,
		sha256,
		profile,
	}))
	if (stableJson(discovered) !== stableJson(expected))
		throw new Error(
			`historical source inventory is stale; run ${TRUSTED_PUBLISH_COMMAND}`,
		)
	if (
		stableJson(await deriveCompatibility(root)) !==
		stableJson(manifest.compatibility)
	)
		throw new Error(
			`historical image pipeline changed; run ${TRUSTED_PUBLISH_COMMAND}`,
		)
}

async function verifyImage(
	path: string,
	asset: HistoricalManifest["assets"][number],
): Promise<void> {
	const metadata = await sharp(path).metadata()
	const expectedFormat =
		asset.format === "jpg"
			? "jpeg"
			: asset.format === "avif"
				? "heif"
				: asset.format
	if (
		metadata.width !== asset.width ||
		metadata.height !== asset.height ||
		metadata.format !== expectedFormat
	)
		throw new Error(`image metadata mismatch: ${asset.publicPath}`)
}

export async function restore(
	root: string,
	store: ArtifactStore | null,
): Promise<{ restored: number; cached: number; bytesTransferred: number }> {
	let lock: HistoricalLock
	try {
		lock = lockSchema.parse(
			JSON.parse(await readFile(join(root, LOCK_PATH), "utf8")),
		)
	} catch (error) {
		throw new Error(
			`historical image publication lock is missing or invalid; run ${TRUSTED_PUBLISH_COMMAND}`,
			{ cause: error },
		)
	}
	const manifest = await readVerifiedManifest(root, store, lock)
	await verifyCheckout(root, manifest)
	let restored = 0
	let cached = 0
	let bytesTransferred = 0
	const needed: HistoricalManifest["assets"] = []
	for (const asset of manifest.assets) {
		const relativeAsset = restoredAssetPath(asset.publicPath)
		const target = join(root, STATIC_ASSET_ROOT, relativeAsset)
		try {
			if (
				(await stat(target)).size === asset.bytes &&
				(await hashFile(target)) === asset.sha256
			) {
				await verifyImage(target, asset)
				continue
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
		}
		needed.push(asset)
	}
	const neededObjects = [
		...new Map(needed.map((asset) => [asset.sha256, asset])).values(),
	]
	await mapConcurrent(neededObjects, 16, async (asset) => {
		const cachePath = cacheObjectPath(root, asset.sha256)
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
			body = await store.get(objectName(asset.sha256))
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
	await mapConcurrent(needed, 16, async (asset) => {
		const relativeAsset = restoredAssetPath(asset.publicPath)
		const target = join(root, STATIC_ASSET_ROOT, relativeAsset)
		const body = await readFile(cacheObjectPath(root, asset.sha256))
		await mkdir(dirname(target), { recursive: true })
		const temporary = `${target}.${process.pid}.${sha256(asset.publicPath)}.tmp`
		await writeFile(temporary, body)
		await verifyImage(temporary, asset)
		await rename(temporary, target)
		restored += 1
	})
	return { restored, cached, bytesTransferred }
}

export async function clearRestoredAssets(root: string): Promise<void> {
	await rm(join(root, STATIC_ASSET_ROOT), { recursive: true, force: true })
}
