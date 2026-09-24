import { spawnSync } from "child_process"
import { lstatSync, readFileSync, writeFileSync } from "fs"
import { extname, resolve } from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"

export const SOURCE_JPEG_QUALITY = 82
const MINIMUM_SAVINGS_PERCENT = 10
const JPEG_OPTIMIZATION_MARKER = Buffer.from(
	`postplayhouse:source-jpeg:v1;quality=${SOURCE_JPEG_QUALITY}`,
	"ascii",
)

export function isSourceJpegOptimized(path: string): boolean {
	return readFileSync(path).includes(JPEG_OPTIMIZATION_MARKER)
}

export function markSourceJpegOptimized(path: string): void {
	const jpeg = readFileSync(path)
	if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
		throw new Error(`Expected a valid JPEG: ${path}`)
	}
	if (jpeg.includes(JPEG_OPTIMIZATION_MARKER)) return

	const comment = Buffer.alloc(JPEG_OPTIMIZATION_MARKER.length + 4)
	comment[0] = 0xff
	comment[1] = 0xfe
	comment.writeUInt16BE(JPEG_OPTIMIZATION_MARKER.length + 2, 2)
	JPEG_OPTIMIZATION_MARKER.copy(comment, 4)
	writeFileSync(
		path,
		Buffer.concat([jpeg.subarray(0, 2), comment, jpeg.subarray(2)]),
	)
}

function runGit(repoRoot: string, args: string[], encoding: "buffer"): Buffer
function runGit(repoRoot: string, args: string[], encoding?: "utf8"): string
function runGit(
	repoRoot: string,
	args: string[],
	encoding: "buffer" | "utf8" = "utf8",
): Buffer | string {
	const result = spawnSync("git", args, {
		cwd: repoRoot,
		encoding: encoding === "buffer" ? undefined : "utf8",
	})
	if (result.error) throw result.error
	if (result.status !== 0) {
		throw new Error(
			`git ${args.join(" ")} failed: ${String(result.stderr).trim()}`,
		)
	}
	return result.stdout
}

export function stagedAddedJpegs(repoRoot: string): string[] {
	const output = runGit(
		repoRoot,
		["diff", "--cached", "--name-only", "--diff-filter=A", "-z", "--"],
		"buffer",
	)

	return output
		.toString("utf8")
		.split("\0")
		.filter(Boolean)
		.filter((file) => [".jpg", ".jpeg"].includes(extname(file).toLowerCase()))
}

function hasUnstagedChanges(repoRoot: string, file: string): boolean {
	const result = spawnSync("git", ["diff", "--quiet", "--", file], {
		cwd: repoRoot,
	})
	if (result.error) throw result.error
	if (result.status === 0) return false
	if (result.status === 1) return true
	throw new Error(`Unable to inspect unstaged changes for ${file}`)
}

export async function optimizeNewJpegs(
	repoRoot = process.cwd(),
): Promise<string[]> {
	if (process.env.SKIP_NEW_JPEG_OPTIMIZATION === "1") {
		console.log("Skipping new JPEG optimization for this commit")
		return []
	}

	const files = stagedAddedJpegs(repoRoot)
	if (files.length === 0) return []

	for (const file of files) {
		const path = resolve(repoRoot, file)
		if (!lstatSync(path).isFile()) {
			throw new Error(`Staged JPEG is not a regular file: ${file}`)
		}
		if (hasUnstagedChanges(repoRoot, file)) {
			throw new Error(
				`${file} has unstaged changes. Stage or discard them before committing so image optimization does not stage them accidentally.`,
			)
		}
	}

	console.log(
		`Optimizing ${files.length} newly added JPEG${files.length === 1 ? "" : "s"}`,
	)
	for (const file of files) {
		const path = resolve(repoRoot, file)
		if (isSourceJpegOptimized(path)) {
			console.log(`${file} is already optimized; skipped`)
			continue
		}

		const original = readFileSync(path)
		const optimized = await sharp(original)
			.keepMetadata()
			.jpeg({ quality: SOURCE_JPEG_QUALITY, mozjpeg: true })
			.toBuffer()
		const savingsPercent = Math.round(
			(1 - optimized.length / original.length) * 100,
		)
		if (
			optimized.length <=
			original.length * (1 - MINIMUM_SAVINGS_PERCENT / 100)
		) {
			writeFileSync(path, optimized)
			console.log(
				`${file}: ${original.length} → ${optimized.length} bytes (${savingsPercent}% smaller)`,
			)
		} else {
			console.log(
				`${file}: MozJPEG savings were below ${MINIMUM_SAVINGS_PERCENT}%; kept original encoding`,
			)
		}
		markSourceJpegOptimized(path)
		runGit(repoRoot, ["add", "--", file])
	}

	return files
}

async function main() {
	try {
		await optimizeNewJpegs()
	} catch (error) {
		console.error(error instanceof Error ? error.message : error)
		process.exitCode = 1
	}
}

if (
	process.argv[1] &&
	fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
	main()
}
