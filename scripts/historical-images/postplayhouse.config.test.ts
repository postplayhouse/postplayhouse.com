// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { season } from "../../src/data/seasons"
import { discoverArtifactSources } from "./discover"
import provider, {
	archivedYearDirectories,
	generatedLiveImages,
	generatedLiveImagesPath,
	generatedNewsImageReferences,
	imageComponentTags,
	postPlayhouseArtifactConfig,
} from "./postplayhouse.config"
import { historicalImageProfiles } from "./profiles"

const temporary: string[] = []

afterEach(async () => {
	for (const path of temporary.splice(0))
		await rm(path, { recursive: true, force: true })
})

it("recognizes self-closing and paired image components and locates malformed tags", () => {
	expect(
		imageComponentTags(
			'<PersonImage partialPath="2026/jo.jpg"></PersonImage>\n<SeasonImage season="2020" imageFile="show.jpg" />',
			"news/example/+page.svelte",
		),
	).toEqual([
		{
			name: "PersonImage",
			tag: '<PersonImage partialPath="2026/jo.jpg">',
			at: "news/example/+page.svelte:1:1",
		},
		{
			name: "SeasonImage",
			tag: '<SeasonImage season="2020" imageFile="show.jpg" />',
			at: "news/example/+page.svelte:2:1",
		},
	])
	expect(() =>
		imageComponentTags(
			"first line\n<PersonImage partialPath={person.image}",
			"news/bad/+page.svelte",
		),
	).toThrow(/news\/bad\/\+page\.svelte:2:1/)
})

it("extracts paired image components and rejects unresolved occurrences with location", async () => {
	const root = await mkdtemp(join(tmpdir(), "postplayhouse-news-images-"))
	temporary.push(root)
	const news = join(root, "src/routes/(app)/news/example")
	await mkdir(news, { recursive: true })
	const page = join(news, "+page.svelte")
	await writeFile(
		page,
		'<PersonImage partialPath="2026/jo.jpg"></PersonImage>\n<SeasonImage season="2020" imageFile="show.jpg"></SeasonImage>',
	)
	expect(await generatedNewsImageReferences(root)).toContain(
		'people: ["2026/jo.jpg"]',
	)
	expect(await generatedNewsImageReferences(root)).toContain(
		'seasons: ["2020/show.jpg"]',
	)
	await writeFile(page, "first\n<PersonImage partialPath={person.image} />")
	await expect(generatedNewsImageReferences(root)).rejects.toThrow(
		/Cannot resolve PersonImage at news\/example\/\+page\.svelte:2:1/,
	)
})

it("derives the exact Post Playhouse archive and live globs from one season value", async () => {
	const config = await postPlayhouseArtifactConfig(process.cwd())
	const sources = await discoverArtifactSources(process.cwd(), config)
	expect(new Set(sources.map(({ path }) => path))).toHaveLength(650)
	expect(sources).toHaveLength(652)
	expect(sources.some(({ path }) => path.endsWith(".JPG"))).toBe(false)
	expect(sources.some(({ path }) => path.includes(`/${season}/`))).toBe(false)
	expect(
		sources.filter(({ profile }) => profile === "raffle-default-1x-2x"),
	).toHaveLength(2)
	expect(generatedLiveImages()).toContain(`/src/images/people/${season}/*`)
	expect(generatedLiveImages()).toContain(`/src/images/seasons/${season}/*`)
	for (const profile of ["people-400-800", "season-500-1000-1500"] as const)
		for (const [name, value] of Object.entries(
			historicalImageProfiles[profile].query,
		))
			expect(generatedLiveImages()).toContain(
				`${name}: ${JSON.stringify(value)}`,
			)
}, 10_000)

it("tolerates missing years and rejects directories newer than the configured season", async () => {
	const root = await mkdtemp(join(tmpdir(), "postplayhouse-artifact-config-"))
	temporary.push(root)
	for (const directory of ["people/2024", "people/2026", "seasons/2025"])
		await mkdir(join(root, "src/images", directory), { recursive: true })

	const sources = await archivedYearDirectories(root, 2026)
	expect(sources.map(({ id }) => id)).toEqual([
		"people-2024",
		"people-root",
		"seasons-2025",
		"seasons-root",
	])

	await mkdir(join(root, "src/images/seasons/2027"))
	await expect(archivedYearDirectories(root, 2026)).rejects.toThrow(
		/newer than configured season 2026/,
	)
})

it("keeps the checked-in live import module synchronized with the season", async () => {
	const root = await mkdtemp(join(tmpdir(), "postplayhouse-generated-live-"))
	temporary.push(root)
	await mkdir(join(root, "src/routes/(app)/news"), { recursive: true })
	await provider.afterGenerate!(root)
	const generated = await readFile(join(root, generatedLiveImagesPath), "utf8")
	const checkedIn = await readFile(generatedLiveImagesPath, "utf8")
	expect(generated).toBe(checkedIn)
})

it("fails clearly when generated live imports are stale", async () => {
	const root = await mkdtemp(join(tmpdir(), "postplayhouse-stale-live-"))
	temporary.push(root)
	const path = join(root, generatedLiveImagesPath)
	await mkdir(join(root, "src/generated/historical-images"), {
		recursive: true,
	})
	await writeFile(path, "export const generatedCurrentSeason: number = 2026\n")

	await expect(postPlayhouseArtifactConfig(root)).rejects.toThrow(
		`Generated image module is stale: ${generatedLiveImagesPath}; run pnpm images:historical:generate`,
	)
})
