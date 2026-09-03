import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { dirname, extname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import sharp from "sharp"
import { hashFile } from "./hash"

interface FileInventory {
	path: string
	bytes: number
	sha256: string
	format?: string
	width?: number
	height?: number
}

async function walk(directory: string): Promise<string[]> {
	const result: string[] = []
	const entries = await readdir(directory, { withFileTypes: true })
	for (const entry of entries.sort((left, right) =>
		left.name.localeCompare(right.name),
	)) {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) result.push(...(await walk(path)))
		else if (entry.isFile()) result.push(path)
	}
	return result
}

async function inventory(root: string): Promise<FileInventory[]> {
	const result: FileInventory[] = []
	for (const path of await walk(root)) {
		const details = await stat(path)
		const item: FileInventory = {
			path: relative(root, path).split(sep).join("/"),
			bytes: details.size,
			sha256: await hashFile(path),
		}
		if (
			[".avif", ".webp", ".jpg", ".jpeg", ".png"].includes(
				extname(path).toLowerCase(),
			)
		) {
			const metadata = await sharp(path).metadata()
			item.format = metadata.format
			item.width = metadata.width
			item.height = metadata.height
		}
		result.push(item)
	}
	return result.sort((left, right) => left.path.localeCompare(right.path))
}

async function pictureInventory(buildRoot: string): Promise<unknown[]> {
	const pictures: unknown[] = []
	for (const path of (await walk(buildRoot)).filter((path) =>
		path.endsWith(".html"),
	)) {
		const dom = new JSDOM(await readFile(path, "utf8"))
		for (const picture of dom.window.document.querySelectorAll("picture")) {
			pictures.push({
				page: `/${relative(buildRoot, path).split(sep).join("/")}`,
				sources: [...picture.querySelectorAll("source")].map((source) => ({
					type: source.type,
					srcset: source.srcset,
				})),
				img: picture.querySelector("img")
					? {
							src: picture.querySelector("img")?.getAttribute("src"),
							srcset: picture.querySelector("img")?.getAttribute("srcset"),
							alt: picture.querySelector("img")?.getAttribute("alt"),
							class: picture.querySelector("img")?.getAttribute("class"),
							width: picture.querySelector("img")?.getAttribute("width"),
							height: picture.querySelector("img")?.getAttribute("height"),
						}
					: null,
			})
		}
	}
	return pictures
}

async function disk(
	path: string,
): Promise<{ apparentBytes: number; allocatedBytes: number }> {
	let apparentBytes = 0
	let allocatedBytes = 0
	for (const file of await walk(path)) {
		const details = await stat(file)
		apparentBytes += details.size
		allocatedBytes += details.blocks * 512
	}
	return { apparentBytes, allocatedBytes }
}

export async function evaluate(buildRoot: string): Promise<unknown> {
	const assets = await inventory(join(buildRoot, "_app/immutable/assets"))
	const people = await inventory(join(buildRoot, "images/people"))
	return {
		buildRoot,
		assets,
		people,
		pictures: await pictureInventory(buildRoot),
		disk: await disk(buildRoot),
	}
}

export function compare(
	baseline: Awaited<ReturnType<typeof evaluate>>,
	candidate: Awaited<ReturnType<typeof evaluate>>,
): {
	missingOrChangedAssets: string[]
	extraAssets: string[]
	changedPeopleOriginals: string[]
	extraPeopleOriginals: string[]
	picturesEqual: boolean
} {
	const left = baseline as {
		assets: FileInventory[]
		people: FileInventory[]
		pictures: unknown[]
	}
	const right = candidate as {
		assets: FileInventory[]
		people: FileInventory[]
		pictures: unknown[]
	}
	const candidateAssets = new Map(right.assets.map((item) => [item.path, item]))
	const candidatePeople = new Map(right.people.map((item) => [item.path, item]))
	const baselineAssets = new Set(left.assets.map(({ path }) => path))
	const baselinePeople = new Set(left.people.map(({ path }) => path))
	return {
		missingOrChangedAssets: left.assets
			.filter((item) => candidateAssets.get(item.path)?.sha256 !== item.sha256)
			.map(({ path }) => path),
		extraAssets: right.assets
			.filter(({ path }) => !baselineAssets.has(path))
			.map(({ path }) => path),
		changedPeopleOriginals: left.people
			.filter((item) => candidatePeople.get(item.path)?.sha256 !== item.sha256)
			.map(({ path }) => path),
		extraPeopleOriginals: right.people
			.filter(({ path }) => !baselinePeople.has(path))
			.map(({ path }) => path),
		picturesEqual:
			JSON.stringify(left.pictures) === JSON.stringify(right.pictures),
	}
}

async function main(): Promise<void> {
	const baselineIndex = process.argv.indexOf("--baseline")
	const candidateIndex = process.argv.indexOf("--candidate")
	const outputIndex = process.argv.indexOf("--output")
	if (baselineIndex < 0 || candidateIndex < 0 || outputIndex < 0)
		throw new Error(
			"Usage: evaluate --baseline <build> --candidate <build> --output <report.json>",
		)
	const baseline = await evaluate(resolve(process.argv[baselineIndex + 1]))
	const candidate = await evaluate(resolve(process.argv[candidateIndex + 1]))
	const report = {
		baseline,
		candidate,
		comparison: compare(baseline, candidate),
	}
	const output = resolve(process.argv[outputIndex + 1])
	await mkdir(dirname(output), { recursive: true })
	await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
	console.log(JSON.stringify(report.comparison))
}

if (
	process.argv[1] &&
	fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
	main().catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
}
