// @vitest-environment node
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { deriveCompatibility } from "./compatibility"
import { artifactTestConfig } from "./test-config"

const temporary: string[] = []

afterEach(async () => {
	for (const path of temporary.splice(0))
		await rm(path, { recursive: true, force: true })
})

it("invalidates profile and generator changes but ignores unrelated lockfile edits", async () => {
	const root = await mkdtemp(join(tmpdir(), "artifact-compatibility-"))
	temporary.push(root)
	await symlink(join(process.cwd(), "node_modules"), join(root, "node_modules"))
	const config = artifactTestConfig()
	for (const path of config.pipelineSourcePaths) {
		await mkdir(dirname(join(root, path)), { recursive: true })
		await writeFile(join(root, path), "generator v1\n")
	}
	await writeFile(join(root, "pnpm-lock.yaml"), "unrelated: one\n")
	const baseline = await deriveCompatibility(root, config)
	await writeFile(join(root, "pnpm-lock.yaml"), "unrelated: two\n")
	expect(await deriveCompatibility(root, config)).toEqual(baseline)

	const changedProfiles = artifactTestConfig({
		profiles: {
			...config.profiles,
			thumbnail: {
				...config.profiles.thumbnail,
				query: { enhanced: true, w: "101;202" },
			},
		},
	})
	expect(
		(await deriveCompatibility(root, changedProfiles))
			.profileConfigurationSha256,
	).not.toBe(baseline.profileConfigurationSha256)

	await writeFile(join(root, config.pipelineSourcePaths[0]), "generator v2\n")
	expect(
		(await deriveCompatibility(root, config)).generatorSourceSha256,
	).not.toBe(baseline.generatorSourceSha256)
})
