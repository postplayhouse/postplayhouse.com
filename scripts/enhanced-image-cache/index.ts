import { execFileSync } from "node:child_process"
import { rmSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
	acquireCacheLock,
	createArchive,
	deriveIdentity,
	hashFile,
	installCache,
	pointerName,
	temporaryDirectory,
	validatePointer,
	verifyAndExtractArchive,
	type CachePointer,
} from "./cache"
import {
	downloadObject,
	downloadObjectToFile,
	uploadFile,
	uploadJson,
	type B2Credentials,
} from "./b2"

const bucketName = "postplayhouse"

function credentials(mode: "read" | "write"): B2Credentials | null {
	const prefix = mode === "read" ? "B2_CACHE_READ" : "B2_CACHE_WRITE"
	const keyId = process.env[`${prefix}_APPLICATION_KEY_ID`]
	const applicationKey = process.env[`${prefix}_APPLICATION_KEY`]
	const bucketId = process.env.B2_BUCKET_ID
	if (!keyId || !applicationKey || (mode === "write" && !bucketId)) return null
	return { keyId, applicationKey, bucketId, bucketName }
}

export async function restore(root = process.cwd()): Promise<boolean> {
	const auth = credentials("read")
	if (!auth) {
		console.log(
			"Enhanced-image cache: read credentials unavailable; using a cold cache",
		)
		return false
	}
	const temporary = temporaryDirectory("restore")
	let releaseLock: (() => void) | undefined
	try {
		releaseLock = acquireCacheLock(root)
		const identity = await deriveIdentity(root)
		const pointerData = await downloadObject(auth, pointerName(identity))
		if (!pointerData) {
			console.log(
				"Enhanced-image cache: no compatible archive found; using a cold cache",
			)
			return false
		}
		const pointer = JSON.parse(pointerData.toString("utf8")) as CachePointer
		validatePointer(pointer, identity)
		const archivePath = join(temporary, "cache.tar.gz")
		if (!(await downloadObjectToFile(auth, pointer.archiveName, archivePath)))
			throw new Error("The archive referenced by the cache pointer is missing")
		if (
			statSync(archivePath).size !== pointer.archiveSize ||
			(await hashFile(archivePath)) !== pointer.archiveSha256
		)
			throw new Error("Archive digest verification failed")
		const extracted = join(temporary, "extracted")
		const manifest = await verifyAndExtractArchive(
			archivePath,
			extracted,
			identity,
		)
		installCache(root, extracted)
		console.log(
			`Enhanced-image cache: restored and verified ${manifest.files.length} files`,
		)
		return true
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		console.warn(
			`Enhanced-image cache: restore skipped (${message}); using a cold cache`,
		)
		return false
	} finally {
		releaseLock?.()
		rmSync(temporary, { recursive: true, force: true })
	}
}

export async function publish(root = process.cwd()): Promise<CachePointer> {
	const auth = credentials("write")
	if (!auth) {
		throw new Error(
			"Publishing requires B2_CACHE_WRITE_APPLICATION_KEY_ID, B2_CACHE_WRITE_APPLICATION_KEY, and B2_BUCKET_ID",
		)
	}
	const temporary = temporaryDirectory("publish")
	try {
		const identity = await deriveIdentity(root)
		const archivePath = join(temporary, "cache.tar.gz")
		let commit: string | null = null
		try {
			commit = execFileSync("git", ["rev-parse", "HEAD"], {
				cwd: root,
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			}).trim()
		} catch {
			// A commit is useful provenance, but is not part of cache compatibility.
		}
		await createArchive(root, archivePath, identity, commit)
		await verifyAndExtractArchive(
			archivePath,
			join(temporary, "verification"),
			identity,
		)
		const archiveSha256 = await hashFile(archivePath)
		const archiveName = `cache/enhanced-image/v1/${identity.compatibilityHash}/${identity.sourceSetHash}/archives/${archiveSha256}.tar.gz`
		const pointer: CachePointer = {
			formatVersion: 1,
			compatibilityHash: identity.compatibilityHash,
			sourceSetHash: identity.sourceSetHash,
			archiveName,
			archiveSha256,
			archiveSize: statSync(archivePath).size,
			createdAt: new Date().toISOString(),
		}
		// The immutable archive must exist before readers can observe its pointer.
		await uploadFile(auth, archiveName, archivePath)
		await uploadJson(auth, pointerName(identity), pointer)
		console.log(`Enhanced-image cache: published ${archiveName}`)
		return pointer
	} finally {
		rmSync(temporary, { recursive: true, force: true })
	}
}

async function main(): Promise<void> {
	const command = process.argv[2]
	if (command === "restore") await restore()
	else if (command === "publish") await publish()
	else throw new Error("Usage: pnpm cache:images:{restore|publish}")
}

if (
	process.argv[1] &&
	fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error)
		process.exitCode = 1
	})
}
