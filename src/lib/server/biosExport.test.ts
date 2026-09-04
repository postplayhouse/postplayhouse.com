import type { ApprovedBio } from "$lib/server/blobs"
import yaml from "js-yaml"
import JSZip from "jszip"
import { describe, expect, it } from "vitest"
import {
	BiosExportError,
	createBiosExportZip,
	getCheckedInPeopleYaml,
	serializeApprovedBios,
} from "./biosExport"

const source = `# header stays exactly
# start __2__
- last_name: Untouched
  first_name: Person
  image_year: 2027
  positions:
    - Keep this
# end __2__
# between stays exactly
# start __1__
- last_name: Old
  first_name: Name
  image_year: 2026
  image_file: old.jpg
  location: Old place
  groups:
    - staff
  positions:
    - Board President
  staff_positions:
    - Old staff job
  production_positions:
    Old Show:
      - Old production job
  roles:
    Old Show:
      - Old role
  program_bio: |
    Old program bio.
  bio: |
    Old bio.
  lobby_display: true
  sort_group: 4
# end __1__
# start __3__
# end __3__
`

function approved(overrides: Partial<ApprovedBio> = {}): ApprovedBio {
	return {
		position: 1,
		firstName: "Ada",
		lastName: "Lovelace: Byron",
		location: 'London: "UK"',
		email: "private@example.com",
		bio: "Line one.\n\nLine two: escaped.",
		imageYear: 2027,
		originalImageUrl: "originals/2027/private.png",
		optimizedImageUrl: "optimized/2027/ada-lovelace.jpg",
		submittedAt: "2026-09-01T00:00:00.000Z",
		approvedAt: "2026-09-02T00:00:00.000Z",
		approvedBy: "admin-position-3",
		...overrides,
	}
}

function people(content: string): Record<string, unknown>[] {
	return yaml.load(content, { schema: yaml.JSON_SCHEMA }) as Record<
		string,
		unknown
	>[]
}

describe("serializeApprovedBios", () => {
	it("loads the checked-in YAML as raw source", () => {
		expect(getCheckedInPeopleYaml("2027")).toContain("# start __1__")
		expect(getCheckedInPeopleYaml("9999")).toBeUndefined()
	})

	it("replaces only approved marker bodies and emits reviewed YAML safely", () => {
		const result = serializeApprovedBios(source, [
			approved({
				staffPositions: ["Director: Interim"],
				productionPositions: { "Show: One": ["Designer"] },
				roles: { "Show: One": ["Lead"] },
				programBio: "Program line one.\nProgram line two.",
			}),
		])

		expect(result.images).toEqual([
			{
				b2Path: "optimized/2027/ada-lovelace.jpg",
				archivePath: "src/images/people/2027/ada-lovelace.jpg",
			},
		])
		expect(result.yaml).toContain(`# header stays exactly
# start __2__
- last_name: Untouched
  first_name: Person
  image_year: 2027
  positions:
    - Keep this
# end __2__
# between stays exactly`)
		expect(result.yaml).toContain("# start __3__\n# end __3__\n")

		const exported = people(result.yaml)[1]!
		expect(exported).toMatchObject({
			last_name: "Lovelace: Byron",
			first_name: "Ada",
			image_year: 2027,
			image_file: "ada-lovelace.jpg",
			location: 'London: "UK"',
			positions: ["Board President"],
			staff_positions: ["Director: Interim"],
			production_positions: { "Show: One": ["Designer"] },
			roles: { "Show: One": ["Lead"] },
			program_bio: "Program line one.\nProgram line two.",
			bio: "Line one.\n\nLine two: escaped.",
			lobby_display: true,
			sort_group: 4,
			bio_approved: true,
		})
		expect(result.yaml).not.toContain("private@example.com")
		expect(result.yaml).not.toContain("originals/2027")
		expect(result.yaml).not.toContain("optimized/2027")
		expect(result.yaml).not.toContain("approvedBy")
	})

	it("clears absent submitted optionals", () => {
		const exported = people(
			serializeApprovedBios(source, [approved()]).yaml,
		)[1]!
		for (const field of [
			"program_bio",
			"staff_positions",
			"production_positions",
			"roles",
		]) {
			expect(exported).not.toHaveProperty(field)
		}
	})

	it.each([
		[undefined, ["staff"]],
		[[], []],
		[
			["cast", "crew"],
			["cast", "crew"],
		],
	] as const)("applies groups patch semantics for %j", (groups, expected) => {
		const exported = people(
			serializeApprovedBios(source, [
				approved({ groups: groups ? [...groups] : groups }),
			]).yaml,
		)[1]!
		expect(exported["groups"]).toEqual(expected)
	})

	it("sorts approved records by position without changing marker order", () => {
		const result = serializeApprovedBios(source, [
			approved({
				position: 3,
				firstName: "Third",
				optimizedImageUrl: "optimized/2027/third.jpg",
			}),
			approved(),
		])
		expect(result.yaml.indexOf("# start __2__")).toBeLessThan(
			result.yaml.indexOf("# start __1__"),
		)
		expect(result.images.map((image) => image.b2Path)).toEqual([
			"optimized/2027/ada-lovelace.jpg",
			"optimized/2027/third.jpg",
		])
	})

	it.each([
		[
			"missing optimized image",
			[approved({ optimizedImageUrl: undefined })],
			422,
		],
		[
			"unsafe optimized path",
			[approved({ optimizedImageUrl: "optimized/2027/../secret.jpg" })],
			422,
		],
		["missing marker", [approved({ position: 99 })], 409],
		["duplicate position", [approved(), approved()], 409],
		[
			"case-insensitive archive collision",
			[
				approved(),
				approved({
					position: 3,
					optimizedImageUrl: "optimized/2027/ADA-LOVELACE.jpg",
				}),
			],
			409,
		],
	] as const)("rejects %s", (_name, bios, status) => {
		expect(() => serializeApprovedBios(source, [...bios])).toThrowError(
			expect.objectContaining<Partial<BiosExportError>>({ status }),
		)
	})

	it("uses imageYear for archival when the optimized B2 key uses another year", () => {
		const result = serializeApprovedBios(source, [
			approved({ optimizedImageUrl: "optimized/2026/ada.jpg" }),
		])
		expect(result.images[0]).toEqual({
			b2Path: "optimized/2026/ada.jpg",
			archivePath: "src/images/people/2027/ada.jpg",
		})
		expect(people(result.yaml)[1]!["image_file"]).toBe("ada.jpg")
	})
})

describe("createBiosExportZip", () => {
	it("creates deterministic, sorted archives with fixed metadata", async () => {
		const images = [
			{
				b2Path: "optimized/2027/z.jpg",
				archivePath: "src/images/people/2027/z.jpg",
				content: Buffer.from("z-image"),
			},
			{
				b2Path: "optimized/2027/a.jpg",
				archivePath: "src/images/people/2027/a.jpg",
				content: Buffer.from("a-image"),
			},
		]
		const first = await createBiosExportZip("2027", source, images)
		const second = await createBiosExportZip("2027", source, images.reverse())

		expect(first).toEqual(second)
		const zip = await JSZip.loadAsync(first)
		expect(Object.keys(zip.files)).toEqual([
			"src/data/people/2027.yml",
			"src/images/people/2027/a.jpg",
			"src/images/people/2027/z.jpg",
		])
		for (const entry of Object.values(zip.files)) {
			expect(entry.date.toISOString()).toBe("1980-01-01T00:00:00.000Z")
		}
		expect(await zip.file("src/data/people/2027.yml")!.async("string")).toBe(
			source,
		)
		expect(
			await zip.file("src/images/people/2027/a.jpg")!.async("nodebuffer"),
		).toEqual(Buffer.from("a-image"))
	})
})
