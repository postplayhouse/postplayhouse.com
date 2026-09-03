// @vitest-environment node
import { readFile } from "node:fs/promises"
import { afterEach, expect, it } from "vitest"
import {
	artifactStoreFromEnvironment,
	assertTrustedGenerationPlatform,
	loadConfig,
} from "./commands"
import { parseCli } from "./index"
import { artifactTestConfig } from "./test-config"

const names = [
	"HISTORICAL_IMAGES_READ_B2_BUCKET_ID",
	"HISTORICAL_IMAGES_READ_B2_APPLICATION_KEY_ID",
	"HISTORICAL_IMAGES_READ_B2_APPLICATION_KEY",
	"HISTORICAL_IMAGES_PUBLISH_B2_BUCKET_ID",
	"HISTORICAL_IMAGES_PUBLISH_B2_APPLICATION_KEY_ID",
	"HISTORICAL_IMAGES_PUBLISH_B2_APPLICATION_KEY",
	"B2_BUCKET_ID",
	"B2_APPLICATION_KEY_ID",
	"B2_APPLICATION_KEY",
] as const

afterEach(() => {
	for (const name of names) delete process.env[name]
})

it("never selects bio or publisher credentials for ordinary restore", () => {
	process.env.B2_BUCKET_ID = "bio-bucket"
	process.env.B2_APPLICATION_KEY_ID = "bio-key-id"
	process.env.B2_APPLICATION_KEY = "bio-key"
	process.env.HISTORICAL_IMAGES_PUBLISH_B2_BUCKET_ID = "publish-bucket"
	process.env.HISTORICAL_IMAGES_PUBLISH_B2_APPLICATION_KEY_ID = "publish-key-id"
	process.env.HISTORICAL_IMAGES_PUBLISH_B2_APPLICATION_KEY = "publish-key"
	expect(
		artifactStoreFromEnvironment(artifactTestConfig(), "restore"),
	).toBeNull()
})

it("fails incomplete read configuration and accepts a complete dedicated contract", () => {
	process.env.HISTORICAL_IMAGES_READ_B2_BUCKET_ID = "read-bucket"
	expect(() =>
		artifactStoreFromEnvironment(artifactTestConfig(), "restore"),
	).toThrow(/HISTORICAL_IMAGES_READ_B2 configuration is incomplete/)
	process.env.HISTORICAL_IMAGES_READ_B2_APPLICATION_KEY_ID = "read-key-id"
	process.env.HISTORICAL_IMAGES_READ_B2_APPLICATION_KEY = "read-key"
	expect(
		artifactStoreFromEnvironment(artifactTestConfig(), "restore"),
	).not.toBeNull()
})

it("limits trusted generation to the qualified platform without limiting hydration", () => {
	expect(() => assertTrustedGenerationPlatform("linux", "x64")).not.toThrow()
	expect(() => assertTrustedGenerationPlatform("darwin", "arm64")).toThrow(
		/require the qualified linux\/x64 toolchain.*use hydrate-generation or restore/,
	)
})

it("strictly parses command-specific options before command modules load", () => {
	expect(parseCli(["--help"])).toHaveProperty("help")
	expect(parseCli(["doctor", "--json"])).toMatchObject({
		command: "doctor",
		json: true,
	})
	expect(() => parseCli(["unknown"])).toThrow(/Unknown command/)
	expect(() => parseCli(["restore", "--output", "out"])).toThrow(
		/Unknown option '--output'/,
	)
	expect(() => parseCli(["publish", "--output"])).toThrow(/argument missing/)
})

it("validates every provider at the CLI boundary", async () => {
	await expect(
		loadConfig(
			{
				load: async () => ({ ...artifactTestConfig(), lockPath: "../unsafe" }),
			},
			true,
		),
	).rejects.toThrow(/lockPath must be a safe relative path/)
})

it("runs the Netlify restore once and before validation and Vite", async () => {
	const pkg = JSON.parse(await readFile("package.json", "utf8")) as {
		scripts: Record<string, string>
	}
	const command = pkg.scripts["netlify:validated"]
	expect(command.match(/images:historical:restore/g)).toHaveLength(1)
	expect(command.indexOf("images:historical:restore")).toBeLessThan(
		command.indexOf("test:unit"),
	)
	expect(command).toContain("build:vite")
	expect(pkg.scripts["build:vite"]).not.toContain("images:historical:restore")
})
