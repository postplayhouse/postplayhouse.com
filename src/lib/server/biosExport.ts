import type { ApprovedBio } from "$lib/server/blobs"
import { personSchema } from "$data/validation"
import yaml from "js-yaml"
import JSZip from "jszip"

const peopleYamlFiles = import.meta.glob<string>("/src/data/people/*.yml", {
	eager: true,
	query: "?raw",
	import: "default",
})

const zipDate = new Date("1980-01-01T00:00:00.000Z")
const optimizedImagePath =
	/^optimized\/(\d{4})\/([A-Za-z0-9][A-Za-z0-9._-]*\.jpg)$/
const cmsOwnedFields = new Set([
	"last_name",
	"first_name",
	"image_year",
	"image_file",
	"location",
	"groups",
	"staff_positions",
	"production_positions",
	"roles",
	"program_bio",
	"bio",
	"bio_approved",
])

export class BiosExportError extends Error {
	constructor(
		message: string,
		readonly status: 409 | 422,
	) {
		super(message)
	}
}

export type ExportImage = {
	b2Path: string
	archivePath: string
}

export function getCheckedInPeopleYaml(year: string): string | undefined {
	return peopleYamlFiles[`/src/data/people/${year}.yml`]
}

function markerMatches(
	source: string,
	position: number,
	type: "start" | "end",
): RegExpMatchArray[] {
	const expression = new RegExp(`^# ${type} __${position}__\\r?$`, "gm")
	return [...source.matchAll(expression)]
}

function existingPerson(
	block: string,
	position: number,
): Record<string, unknown> {
	if (!block.trim()) return {}

	let parsed: unknown
	try {
		parsed = yaml.load(block, { schema: yaml.JSON_SCHEMA })
	} catch {
		throw new BiosExportError(
			`Existing YAML is invalid at position ${position}`,
			422,
		)
	}

	if (
		!Array.isArray(parsed) ||
		parsed.length !== 1 ||
		!parsed[0] ||
		typeof parsed[0] !== "object" ||
		Array.isArray(parsed[0])
	) {
		throw new BiosExportError(
			`Existing YAML has an invalid record at position ${position}`,
			422,
		)
	}

	return parsed[0] as Record<string, unknown>
}

function archiveImage(bio: ApprovedBio): ExportImage {
	if (!bio.optimizedImageUrl) {
		throw new BiosExportError(
			`Approved bio at position ${bio.position} has no optimized image`,
			422,
		)
	}

	const match = optimizedImagePath.exec(bio.optimizedImageUrl)
	if (!match) {
		throw new BiosExportError(
			`Approved bio at position ${bio.position} has an invalid optimized image path`,
			422,
		)
	}

	return {
		b2Path: bio.optimizedImageUrl,
		archivePath: `src/images/people/${bio.imageYear}/${match[2]}`,
	}
}

function exportedPerson(
	existing: Record<string, unknown>,
	bio: ApprovedBio,
	image: ExportImage,
): Record<string, unknown> {
	const filename = image.archivePath.slice(
		image.archivePath.lastIndexOf("/") + 1,
	)
	const person: Record<string, unknown> = {
		last_name: bio.lastName,
		first_name: bio.firstName,
		image_year: bio.imageYear,
		image_file: filename,
		location: bio.location,
	}

	if (bio.groups !== undefined) person["groups"] = bio.groups
	else if (existing["groups"] !== undefined)
		person["groups"] = existing["groups"]

	for (const [field, value] of Object.entries(existing)) {
		if (!cmsOwnedFields.has(field)) person[field] = value
	}

	if (bio.staffPositions !== undefined) {
		person["staff_positions"] = bio.staffPositions
	}
	if (bio.productionPositions !== undefined) {
		person["production_positions"] = bio.productionPositions
	}
	if (bio.roles !== undefined) person["roles"] = bio.roles
	if (bio.programBio !== undefined) person["program_bio"] = bio.programBio
	person["bio"] = bio.bio
	person["bio_approved"] = true

	const result = personSchema.safeParse(person)
	if (!result.success) {
		throw new BiosExportError(
			`Approved bio at position ${bio.position} cannot be represented in people YAML`,
			422,
		)
	}
	return person
}

export function serializeApprovedBios(
	source: string,
	approvedBios: ApprovedBio[],
): { yaml: string; images: ExportImage[] } {
	const positions = new Set<number>()
	const archivePaths = new Set<string>()
	const replacements: { start: number; end: number; body: string }[] = []
	const images: ExportImage[] = []

	for (const bio of [...approvedBios].sort((a, b) => a.position - b.position)) {
		if (positions.has(bio.position)) {
			throw new BiosExportError(
				`Multiple approved bios exist for position ${bio.position}`,
				409,
			)
		}
		positions.add(bio.position)

		const starts = markerMatches(source, bio.position, "start")
		const ends = markerMatches(source, bio.position, "end")
		if (starts.length !== 1 || ends.length !== 1) {
			throw new BiosExportError(
				`Expected exactly one marker block for position ${bio.position}`,
				409,
			)
		}

		const startMatch = starts[0]!
		const endMatch = ends[0]!
		const startLineEnd = startMatch.index! + startMatch[0].length
		const lineEnding =
			source.slice(startLineEnd, startLineEnd + 2) === "\r\n" ? "\r\n" : "\n"
		const bodyStart = startLineEnd + lineEnding.length
		if (bodyStart > endMatch.index!) {
			throw new BiosExportError(
				`Marker block is malformed for position ${bio.position}`,
				409,
			)
		}

		const image = archiveImage(bio)
		const normalizedArchivePath = image.archivePath.toLowerCase()
		if (archivePaths.has(normalizedArchivePath)) {
			throw new BiosExportError(
				`Multiple approved bios use archive path ${image.archivePath}`,
				409,
			)
		}
		archivePaths.add(normalizedArchivePath)
		images.push(image)

		const existing = existingPerson(
			source.slice(bodyStart, endMatch.index!),
			bio.position,
		)
		const body = yaml
			.dump([exportedPerson(existing, bio, image)], {
				schema: yaml.JSON_SCHEMA,
				lineWidth: -1,
				noRefs: true,
				noCompatMode: true,
			})
			.replaceAll("\n", lineEnding)
		replacements.push({ start: bodyStart, end: endMatch.index!, body })
	}

	let result = source
	for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
		result =
			result.slice(0, replacement.start) +
			replacement.body +
			result.slice(replacement.end)
	}

	let parsed: unknown
	try {
		parsed = yaml.load(result, { schema: yaml.JSON_SCHEMA })
		personSchema.array().parse(parsed)
	} catch {
		throw new BiosExportError("Generated people YAML failed validation", 422)
	}

	return { yaml: result, images }
}

export async function createBiosExportZip(
	year: string,
	yamlContent: string,
	images: Array<ExportImage & { content: Buffer }>,
): Promise<Uint8Array> {
	const zip = new JSZip()
	const fileOptions = {
		date: zipDate,
		createFolders: false,
		unixPermissions: 0o100644,
	}

	zip.file(`src/data/people/${year}.yml`, yamlContent, fileOptions)
	for (const image of [...images].sort((a, b) =>
		a.archivePath < b.archivePath ? -1 : a.archivePath > b.archivePath ? 1 : 0,
	)) {
		zip.file(image.archivePath, image.content, fileOptions)
	}

	return zip.generateAsync({
		type: "uint8array",
		compression: "DEFLATE",
		compressionOptions: { level: 9 },
		platform: "UNIX",
		streamFiles: false,
	})
}
