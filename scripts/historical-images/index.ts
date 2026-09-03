import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { prepareGeneration, publish, restore } from "./archive"
import { B2ArtifactStore } from "./b2"
import type { ArtifactConfig, ArtifactConfigProvider } from "./config"
import { discoverArtifactSources } from "./discover"
import { generate } from "./generate"
import { FileArtifactStore, type ArtifactStore } from "./store"

const root = process.cwd()

function argument(name: string): string | undefined {
	const index = process.argv.indexOf(name)
	return index < 0 ? undefined : process.argv[index + 1]
}

async function configProvider(): Promise<ArtifactConfigProvider> {
	const path = resolve(
		argument("--config") ?? "scripts/historical-images/postplayhouse.config.ts",
	)
	const loaded = (await import(pathToFileURL(path).href)) as {
		default?: ArtifactConfigProvider
	}
	if (!loaded.default?.load)
		throw new Error(
			`Artifact config module must default-export a provider: ${path}`,
		)
	return loaded.default
}

export function artifactStoreFromEnvironment(
	config: ArtifactConfig,
	purpose: "restore" | "publish",
): ArtifactStore | null {
	const mock = process.env.HISTORICAL_IMAGES_STORE_DIR
	if (mock) return new FileArtifactStore(resolve(mock))
	const prefix =
		purpose === "publish"
			? "HISTORICAL_IMAGES_PUBLISH_B2"
			: "HISTORICAL_IMAGES_READ_B2"
	const keyId = process.env[`${prefix}_APPLICATION_KEY_ID`]
	const applicationKey = process.env[`${prefix}_APPLICATION_KEY`]
	const bucketId = process.env[`${prefix}_BUCKET_ID`]
	if (!keyId && !applicationKey && !bucketId) return null
	if (!keyId || !applicationKey || !bucketId)
		throw new Error(
			`${prefix} configuration is incomplete; its BUCKET_ID, APPLICATION_KEY_ID, and APPLICATION_KEY must be set together`,
		)
	return new B2ArtifactStore({
		keyId,
		applicationKey,
		bucketId,
		storePrefix: config.storePrefix,
	})
}

export function assertTrustedGenerationPlatform(
	platform = process.platform,
	arch = process.arch,
): void {
	if (platform !== "linux" || arch !== "x64")
		throw new Error(
			`Historical image generation and publication require the qualified linux/x64 toolchain (current: ${platform}/${arch}); use prepare or restore to hydrate final bytes`,
		)
}

async function main(): Promise<void> {
	const command = process.argv[2]
	const provider = await configProvider()
	const allowGeneratedOutputsToBeStale =
		command === "generate" || command === "discover"
	const config = await provider.load(root, { allowGeneratedOutputsToBeStale })
	if (command === "discover") {
		const sources = await discoverArtifactSources(root, config)
		console.log(
			JSON.stringify({
				profiles: sources.length,
				sources: new Set(sources.map(({ path }) => path)).size,
			}),
		)
		return
	}
	if (command === "generate") {
		assertTrustedGenerationPlatform()
		const output = resolve(
			argument("--output") ?? ".historical-images-output.ignore",
		)
		const manifest = await generate({
			root,
			config,
			output,
			previousManifest: argument("--previous"),
			allowDeleted: process.argv.includes("--allow-deleted"),
			createdAt: process.env.SOURCE_DATE_EPOCH
				? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
				: undefined,
		})
		await provider.afterGenerate?.(root)
		console.log(
			JSON.stringify({
				publicationId: manifest.publicationId,
				sources: manifest.sources.length,
				assets: manifest.assets.length,
			}),
		)
		return
	}
	if (command === "publish") {
		assertTrustedGenerationPlatform()
		const store = artifactStoreFromEnvironment(config, "publish")
		if (!store)
			throw new Error(
				"Publishing requires the HISTORICAL_IMAGES_PUBLISH_B2_* credentials (or HISTORICAL_IMAGES_STORE_DIR for a local mock)",
			)
		if (store instanceof B2ArtifactStore) await store.checkPermissions(true)
		const output = resolve(
			argument("--output") ?? ".historical-images-output.ignore",
		)
		console.log(
			JSON.stringify(
				await publish(
					root,
					config,
					store,
					resolve(output, "manifest.v1.json"),
					resolve(output, "assets"),
				),
			),
		)
		return
	}
	if (command === "prepare") {
		const store = artifactStoreFromEnvironment(config, "restore")
		if (store instanceof B2ArtifactStore) await store.checkPermissions(false)
		const output = resolve(
			argument("--output") ?? ".historical-images-output.ignore",
		)
		console.log(
			JSON.stringify(await prepareGeneration(root, config, store, output)),
		)
		return
	}
	if (command === "restore" || command === "verify") {
		const store = artifactStoreFromEnvironment(config, "restore")
		if (store instanceof B2ArtifactStore) await store.checkPermissions(false)
		const result = await restore(root, config, store)
		console.log(JSON.stringify(result))
		return
	}
	throw new Error(
		"Usage: historical-images <discover|prepare|generate|publish|restore|verify> [--config path]",
	)
}

if (
	process.argv[1] &&
	fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error)
		process.exitCode = 1
	})
}
