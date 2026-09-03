import type { ArtifactConfig } from "./config"

export function artifactTestConfig(
	overrides: Partial<ArtifactConfig> = {},
): ArtifactConfig {
	return {
		identity: "fixture-v1",
		schemaVersion: 1,
		generatorRevision: 1,
		storePrefix: "fixture-artifacts/v1",
		lockPath: "artifact-lock/publication.v1.json",
		generatedMetadataPath: "generated/artifact-pictures.ts",
		generatedOutputPaths: ["generated/artifact-pictures.ts"],
		pipelineSourcePaths: ["scripts/generator.ts"],
		staticAssetRoot: "static/assets",
		cacheRoot: ".cache/artifacts",
		publicAssetPrefix: "/assets/",
		trustedPublishCommand: "pnpm artifacts:publish",
		profiles: {
			thumbnail: {
				query: { enhanced: true, w: "100;200" },
				srcsetDescriptors: "width",
			},
			density: {
				query: { enhanced: true },
				srcsetDescriptors: "density",
			},
		},
		sources: [],
		profileExceptions: [],
		...overrides,
	}
}
