import { createHash } from "node:crypto"
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join, posix, relative, sep } from "node:path"
import { createReadStream } from "node:fs"
import { c as createTar, t as listTar, x as extractTar } from "tar"

export const CACHE_FORMAT_VERSION = 1
export const CACHE_PREFIX = `cache/enhanced-image/v${CACHE_FORMAT_VERSION}`
export const CACHE_RELATIVE_PATH = "node_modules/.cache/imagetools"
export const MANIFEST_PATH = "manifest.json"

const IMAGE_EXTENSIONS = new Set([
	".avif",
	".gif",
	".heif",
	".jpeg",
	".jpg",
	".png",
	".svg",
	".tif",
	".tiff",
	".webp",
])
const CONFIG_PATTERN = /enhanced:img|enhanced\s*:\s*true|enhancedImages\s*\(/
const MAX_ARCHIVE_FILES = 200_000
const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024 * 1024

export interface HashedFile {
	path: string
	size: number
	sha256: string
}

export interface CacheIdentity {
	compatibilityHash: string
	sourceSetHash: string
	compatibility: {
		packages: Record<string, string>
		libvips: string
		nodeMajor: number
		platform: NodeJS.Platform
		arch: string
		lockfile: HashedFile
		configuration: HashedFile[]
	}
	sources: HashedFile[]
}

export interface CacheManifest extends CacheIdentity {
	formatVersion: number
	createdAt: string
	commit: string | null
	files: HashedFile[]
}

export interface CachePointer {
	formatVersion: number
	compatibilityHash: string
	sourceSetHash: string
	archiveName: string
	archiveSha256: string
	archiveSize: number
	createdAt: string
}

export function deriveHashes(
	compatibility: CacheIdentity["compatibility"],
	sources: HashedFile[],
): Pick<CacheIdentity, "compatibilityHash" | "sourceSetHash"> {
	return {
		compatibilityHash: sha256(stableJson(compatibility)),
		sourceSetHash: sha256(stableJson(sources)),
	}
}

function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
	if (value && typeof value === "object") {
		return `{${Object.entries(value)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
			.join(",")}}`
	}
	return JSON.stringify(value)
}

export function sha256(data: string | Buffer): string {
	return createHash("sha256").update(data).digest("hex")
}

export async function hashFile(path: string): Promise<string> {
	const hash = createHash("sha256")
	for await (const chunk of createReadStream(path)) hash.update(chunk)
	return hash.digest("hex")
}

function walkFiles(root: string): string[] {
	if (!existsSync(root)) return []
	const result: string[] = []
	for (const entry of readdirSync(root, { withFileTypes: true })) {
		const path = join(root, entry.name)
		if (entry.isDirectory()) result.push(...walkFiles(path))
		else if (entry.isFile()) result.push(path)
	}
	return result
}

async function describeFiles(
	root: string,
	paths: string[],
): Promise<HashedFile[]> {
	const result: HashedFile[] = []
	for (const path of paths.sort()) {
		const stats = statSync(path)
		result.push({
			path: relative(root, path).split(sep).join("/"),
			size: stats.size,
			sha256: await hashFile(path),
		})
	}
	return result
}

function packageVersion(root: string, name: string): string {
	const packagePath = join(
		root,
		"node_modules",
		...name.split("/"),
		"package.json",
	)
	const candidates = existsSync(packagePath)
		? [packagePath]
		: readdirSync(join(root, "node_modules", ".pnpm"), { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) =>
					join(
						root,
						"node_modules",
						".pnpm",
						entry.name,
						"node_modules",
						...name.split("/"),
						"package.json",
					),
				)
				.filter(existsSync)
	for (const candidate of candidates) {
		const pkg = JSON.parse(readFileSync(candidate, "utf8")) as {
			name?: string
			version?: string
		}
		if (pkg.name === name && pkg.version) return pkg.version
	}
	throw new Error(
		`Cannot determine installed ${name} version; run pnpm install first`,
	)
}

export async function deriveIdentity(
	root = process.cwd(),
): Promise<CacheIdentity> {
	const lockPath = join(root, "pnpm-lock.yaml")
	const lockfile = (await describeFiles(root, [lockPath]))[0]
	const sourceCode = walkFiles(join(root, "src")).filter((path) =>
		/\.(?:js|ts|svelte)$/.test(path),
	)
	const configurationPaths = [join(root, "vite.config.ts")].concat(
		sourceCode.filter((path) =>
			CONFIG_PATTERN.test(readFileSync(path, "utf8")),
		),
	)
	const configuration = await describeFiles(root, [
		...new Set(configurationPaths),
	])
	const imagePaths = [join(root, "src"), join(root, "static")]
		.flatMap(walkFiles)
		.filter((path) => IMAGE_EXTENSIONS.has(posix.extname(path).toLowerCase()))
		.filter((path) => !path.split(sep).includes("cache.ignore"))
	const sources = await describeFiles(root, imagePaths)
	const sharp = (await import("sharp")).default
	const compatibility = {
		packages: Object.fromEntries(
			[
				"@sveltejs/enhanced-img",
				"vite-imagetools",
				"imagetools-core",
				"sharp",
			].map((name) => [name, packageVersion(root, name)]),
		),
		libvips: sharp.versions.vips,
		nodeMajor: Number(process.versions.node.split(".")[0]),
		platform: process.platform,
		arch: process.arch,
		lockfile,
		configuration,
	}
	return {
		...deriveHashes(compatibility, sources),
		compatibility,
		sources,
	}
}

export function pointerName(identity: CacheIdentity): string {
	return `${CACHE_PREFIX}/${identity.compatibilityHash}/${identity.sourceSetHash}/latest.json`
}

export function isSafeArchivePath(path: string): boolean {
	if (
		!path ||
		path.includes("\0") ||
		path.includes("\\") ||
		posix.isAbsolute(path)
	)
		return false
	const normalized = posix.normalize(path)
	if (
		normalized !== path.replace(/\/$/, "") ||
		normalized === ".." ||
		normalized.startsWith("../")
	)
		return false
	return (
		normalized === MANIFEST_PATH ||
		normalized === CACHE_RELATIVE_PATH ||
		normalized.startsWith(`${CACHE_RELATIVE_PATH}/`)
	)
}

function assertManifest(
	manifest: CacheManifest,
	identity: CacheIdentity,
): void {
	if (
		manifest.formatVersion !== CACHE_FORMAT_VERSION ||
		manifest.compatibilityHash !== identity.compatibilityHash ||
		manifest.sourceSetHash !== identity.sourceSetHash ||
		stableJson(manifest.compatibility) !== stableJson(identity.compatibility) ||
		stableJson(manifest.sources) !== stableJson(identity.sources) ||
		!Array.isArray(manifest.files)
	) {
		throw new Error("Cache manifest is incompatible with this checkout")
	}
}

export async function createArchive(
	root: string,
	archivePath: string,
	identity: CacheIdentity,
	commit: string | null,
): Promise<CacheManifest> {
	const cachePath = join(root, CACHE_RELATIVE_PATH)
	const cacheFiles = await describeFiles(cachePath, walkFiles(cachePath))
	if (cacheFiles.length === 0)
		throw new Error("The imagetools cache is empty; build before publishing")
	const stage = mkdtempSync(join(tmpdir(), "enhanced-image-cache-publish-"))
	try {
		const manifest: CacheManifest = {
			formatVersion: CACHE_FORMAT_VERSION,
			createdAt: new Date().toISOString(),
			commit,
			...identity,
			files: cacheFiles,
		}
		mkdirSync(join(stage, dirname(CACHE_RELATIVE_PATH)), { recursive: true })
		cpSync(cachePath, join(stage, CACHE_RELATIVE_PATH), { recursive: true })
		writeFileSync(join(stage, MANIFEST_PATH), `${stableJson(manifest)}\n`)
		mkdirSync(dirname(archivePath), { recursive: true })
		await createTar(
			{
				cwd: stage,
				file: archivePath,
				gzip: true,
				portable: true,
				noMtime: true,
			},
			[MANIFEST_PATH, CACHE_RELATIVE_PATH],
		)
		return manifest
	} finally {
		rmSync(stage, { recursive: true, force: true })
	}
}

export async function verifyAndExtractArchive(
	archivePath: string,
	destination: string,
	identity: CacheIdentity,
): Promise<CacheManifest> {
	let files = 0
	let bytes = 0
	let validationError: Error | undefined
	await listTar({
		file: archivePath,
		strict: true,
		filter(entryPath, entry) {
			const path = entryPath.replace(/\/$/, "")
			if (!isSafeArchivePath(path))
				validationError ??= new Error(`Unsafe archive path: ${entryPath}`)
			else if (!("type" in entry))
				validationError ??= new Error("Archive entry metadata is unavailable")
			else if (entry.type !== "File" && entry.type !== "Directory")
				validationError ??= new Error(
					`Unsafe archive entry type: ${entry.type}`,
				)
			if ("type" in entry && entry.type === "File") {
				files += 1
				bytes += entry.size
				if (files > MAX_ARCHIVE_FILES || bytes > MAX_ARCHIVE_BYTES)
					validationError ??= new Error("Archive exceeds cache safety limits")
			}
			return validationError === undefined
		},
	})
	if (validationError) throw validationError
	mkdirSync(destination, { recursive: true })
	await extractTar({
		file: archivePath,
		cwd: destination,
		strict: true,
		preservePaths: false,
	})
	const manifest = JSON.parse(
		readFileSync(join(destination, MANIFEST_PATH), "utf8"),
	) as CacheManifest
	assertManifest(manifest, identity)
	const cachePath = join(destination, CACHE_RELATIVE_PATH)
	const actualFiles = await describeFiles(cachePath, walkFiles(cachePath))
	if (stableJson(actualFiles) !== stableJson(manifest.files))
		throw new Error("Cache file integrity verification failed")
	return manifest
}

export function installCache(root: string, extractedRoot: string): void {
	const destination = join(root, CACHE_RELATIVE_PATH)
	const incoming = join(extractedRoot, CACHE_RELATIVE_PATH)
	const parent = dirname(destination)
	const merged = join(parent, `.imagetools-merged-${process.pid}-${Date.now()}`)
	const old = join(parent, `.imagetools-old-${process.pid}-${Date.now()}`)
	mkdirSync(parent, { recursive: true })
	try {
		if (existsSync(destination))
			cpSync(destination, merged, { recursive: true })
		else mkdirSync(merged, { recursive: true })
		cpSync(incoming, merged, { recursive: true })
		if (existsSync(destination)) renameSync(destination, old)
		try {
			renameSync(merged, destination)
		} catch (error) {
			if (existsSync(old)) renameSync(old, destination)
			throw error
		}
		rmSync(old, { recursive: true, force: true })
	} finally {
		rmSync(merged, { recursive: true, force: true })
	}
}

export function validatePointer(
	pointer: CachePointer,
	identity: CacheIdentity,
): void {
	if (
		pointer.formatVersion !== CACHE_FORMAT_VERSION ||
		pointer.compatibilityHash !== identity.compatibilityHash ||
		pointer.sourceSetHash !== identity.sourceSetHash ||
		!pointer.archiveName.startsWith(
			`${CACHE_PREFIX}/${identity.compatibilityHash}/${identity.sourceSetHash}/archives/`,
		) ||
		!/^[a-f0-9]{64}$/.test(pointer.archiveSha256)
	) {
		throw new Error("Cache pointer is invalid or incompatible")
	}
}

export function temporaryDirectory(label: string): string {
	return mkdtempSync(join(tmpdir(), `enhanced-image-cache-${basename(label)}-`))
}

export function acquireCacheLock(root: string): () => void {
	const lock = join(root, "node_modules", ".cache", ".imagetools-restore.lock")
	mkdirSync(dirname(lock), { recursive: true })
	mkdirSync(lock)
	return () => rmSync(lock, { recursive: true, force: true })
}
