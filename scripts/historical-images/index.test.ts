// @vitest-environment node
import { afterEach, expect, it } from "vitest"
import {
	artifactStoreFromEnvironment,
	assertTrustedGenerationPlatform,
} from "./index"
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
		/require the qualified linux\/x64 toolchain.*use prepare or restore/,
	)
})
