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
	"HISTORICAL_IMAGES_STORE_DIR",
	"B2_BUCKET_ID",
	"B2_APPLICATION_KEY_ID",
	"B2_APPLICATION_KEY",
] as const

afterEach(() => {
	for (const name of names) delete process.env[name]
})

it("uses the existing shared B2 configuration for every historical operation", () => {
	process.env.B2_BUCKET_ID = "shared-bucket"
	process.env.B2_APPLICATION_KEY_ID = "shared-key-id"
	process.env.B2_APPLICATION_KEY = "shared-key"
	expect(artifactStoreFromEnvironment(artifactTestConfig())).not.toBeNull()
})

it("fails incomplete shared B2 configuration", () => {
	process.env.B2_BUCKET_ID = "shared-bucket"
	expect(() => artifactStoreFromEnvironment(artifactTestConfig())).toThrow(
		/B2 configuration is incomplete.*B2_BUCKET_ID.*B2_APPLICATION_KEY_ID.*B2_APPLICATION_KEY/,
	)
})

it("keeps the filesystem fixture independent of shared credential availability", () => {
	process.env.B2_BUCKET_ID = "incomplete-shared-config"
	process.env.HISTORICAL_IMAGES_STORE_DIR = "/tmp/historical-store-fixture"
	expect(artifactStoreFromEnvironment(artifactTestConfig())).not.toBeNull()
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

it("declares only the existing shared B2 credential names", async () => {
	const schema = await readFile(".env.schema", "utf8")
	expect(schema).toContain("B2_BUCKET_ID=")
	expect(schema).toContain("B2_APPLICATION_KEY_ID=")
	expect(schema).toContain("B2_APPLICATION_KEY=")
	expect(schema).not.toMatch(/HISTORICAL_IMAGES_(?:READ|PUBLISH)_B2/)
})
