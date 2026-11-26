import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

export function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
	if (value && typeof value === "object") {
		return `{${Object.entries(value)
			.filter(([, item]) => item !== undefined)
			.sort(([left], [right]) => left.localeCompare(right))
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

export type FileHasher = (path: string) => Promise<string>

// Filesystem timestamps advance in coarse ticks, so a same-size rewrite right
// after hashing can keep every stat field. Like Git's racy-clean rule, files
// changed this recently are rehashed next time instead of being cached.
const racyWindowMs = 2_000

/**
 * A local-only shortcut for repeated restores: reuses a file's digest while its
 * size, inode, mtime, and ctime are unchanged, and hashes it again otherwise.
 * Trusted builds (Netlify, CI) never use it, so they always hash every byte.
 */
export async function statHashCache(
	cachePath: string,
): Promise<{ hash: FileHasher; save: () => Promise<void> }> {
	type Entry = [size: number, ino: number, mtimeMs: number, ctimeMs: number]
	let entries: Record<string, [...Entry, sha256: string]> = {}
	try {
		const parsed: unknown = JSON.parse(await readFile(cachePath, "utf8"))
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
			entries = parsed as typeof entries
	} catch {
		// A missing or unreadable cache only means every file is hashed again.
	}
	const used: typeof entries = {}
	return {
		async hash(path) {
			const before = await stat(path)
			const key: Entry = [
				before.size,
				before.ino,
				before.mtimeMs,
				before.ctimeMs,
			]
			const cached = entries[path]
			if (cached && key.every((value, index) => cached[index] === value)) {
				used[path] = cached
				return cached[4]
			}
			const digest = await hashFile(path)
			const after = await stat(path)
			const unchanged = [
				after.size,
				after.ino,
				after.mtimeMs,
				after.ctimeMs,
			].every((value, index) => key[index] === value)
			const settled =
				Date.now() - Math.max(after.mtimeMs, after.ctimeMs) > racyWindowMs
			if (unchanged && settled) used[path] = [...key, digest]
			return digest
		},
		async save() {
			await mkdir(dirname(cachePath), { recursive: true })
			const temporary = `${cachePath}.${process.pid}.tmp`
			await writeFile(temporary, JSON.stringify(used))
			await rename(temporary, cachePath)
		},
	}
}
