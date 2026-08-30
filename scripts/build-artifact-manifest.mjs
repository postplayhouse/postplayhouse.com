import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"
import { readdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

async function listFiles(root, directory = root) {
	const entries = await readdir(directory, { withFileTypes: true })
	const files = []
	for (const entry of entries) {
		const fullPath = path.join(directory, entry.name)
		if (entry.isDirectory()) files.push(...(await listFiles(root, fullPath)))
		else if (entry.isFile()) files.push(fullPath)
	}
	return files
}

async function sha256(file) {
	const hash = createHash("sha256")
	for await (const chunk of createReadStream(file)) hash.update(chunk)
	return hash.digest("hex")
}

export async function createArtifactManifest(root) {
	const files = await listFiles(root)
	const manifest = []
	for (const file of files.sort()) {
		const details = await stat(file)
		manifest.push({
			path: path.relative(root, file).split(path.sep).join("/"),
			size: details.size,
			sha256: await sha256(file),
		})
	}
	return manifest
}

async function main() {
	const [root, output] = process.argv.slice(2)
	if (!root || !output) {
		throw new Error(
			"usage: build-artifact-manifest.mjs <build-dir> <output.json>",
		)
	}
	const files = await createArtifactManifest(path.resolve(root))
	const report = {
		root: path.resolve(root),
		fileCount: files.length,
		totalBytes: files.reduce((total, file) => total + file.size, 0),
		files,
	}
	await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
	console.log(
		JSON.stringify({
			fileCount: report.fileCount,
			totalBytes: report.totalBytes,
		}),
	)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
}
