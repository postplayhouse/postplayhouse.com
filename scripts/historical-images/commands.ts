import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { promisify } from "node:util"
import type { CliArguments } from "./index"
import {
	validateArtifactConfig,
	type ArtifactConfig,
	type ArtifactConfigProvider,
} from "./config"
import { B2ArtifactStore } from "./b2"
import { hashFile, sha256, stableJson } from "./hash"
import { FileArtifactStore, type ArtifactStore } from "./store"
import { lockSchema, manifestSchema, type HistoricalManifest } from "./schema"

const root = process.cwd()
const defaultOutput = ".historical-images-output.ignore"

async function configProvider(path?: string): Promise<ArtifactConfigProvider> {
	const absolute = resolve(
		path ?? "scripts/historical-images/postplayhouse.config.ts",
	)
	const loaded = (await import(pathToFileURL(absolute).href)) as {
		default?: ArtifactConfigProvider
	}
	if (!loaded.default?.load)
		throw new Error(
			`Artifact config module must default-export a provider: ${absolute}`,
		)
	return loaded.default
}

export async function loadConfig(
	provider: ArtifactConfigProvider,
	allowGeneratedOutputsToBeStale: boolean,
): Promise<ArtifactConfig> {
	return validateArtifactConfig(
		await provider.load(root, { allowGeneratedOutputsToBeStale }),
	)
}

export function artifactStoreFromEnvironment(
	config: ArtifactConfig,
): ArtifactStore | null {
	const mock = process.env.HISTORICAL_IMAGES_STORE_DIR
	if (mock) return new FileArtifactStore(resolve(mock))
	const keyId = process.env.B2_APPLICATION_KEY_ID
	const applicationKey = process.env.B2_APPLICATION_KEY
	const bucketId = process.env.B2_BUCKET_ID
	if (!keyId && !applicationKey && !bucketId) return null
	if (!keyId || !applicationKey || !bucketId)
		throw new Error(
			"B2 configuration is incomplete; B2_BUCKET_ID, B2_APPLICATION_KEY_ID, and B2_APPLICATION_KEY must be set together",
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
			`Historical image generation and publication require the qualified linux/x64 toolchain (current: ${platform}/${arch}); use hydrate-generation or restore to hydrate final bytes`,
		)
}

function outputPath(value?: string): string {
	return resolve(value ?? defaultOutput)
}

async function previousManifest(path: string): Promise<HistoricalManifest> {
	try {
		return manifestSchema.parse(JSON.parse(await readFile(path, "utf8")))
	} catch (error) {
		throw new Error(
			`Reviewed previous manifest is unavailable at ${path}; run pnpm images:historical:stage to hydrate it explicitly`,
			{ cause: error },
		)
	}
}

async function generationPlan(
	config: ArtifactConfig,
	previousPath: string,
): Promise<{
	added: string[]
	changed: string[]
	deleted: string[]
	expectedTransforms: number
	pipelineWideInvalidation: boolean
}> {
	const [
		{ deriveCompatibility, derivePipelineSha256 },
		{ discoverArtifactSources },
	] = await Promise.all([import("./compatibility"), import("./discover")])
	const previous = await previousManifest(previousPath)
	const discovered = await discoverArtifactSources(root, config)
	const compatibility = await deriveCompatibility(root, config)
	let previousTransformsQualified = false
	try {
		const lock = lockSchema.parse(
			JSON.parse(await readFile(join(root, config.lockPath), "utf8")),
		)
		const sourceSetSha256 = sha256(
			stableJson(
				previous.sources.map(({ path, profile, sha256 }) => ({
					path,
					profile,
					sha256,
				})),
			),
		)
		previousTransformsQualified =
			lock.schemaVersion === 2 &&
			(await hashFile(previousPath)) === lock.manifestSha256 &&
			sourceSetSha256 === lock.sourceSetSha256 &&
			(await derivePipelineSha256(root, config)) === lock.pipelineSha256
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
	}
	const key = (source: { path: string; profile: string }) =>
		`${source.path}\0${source.profile}`
	const currentKeys = new Set(discovered.map(key))
	const previousByKey = new Map(
		previous.sources.map((source) => [key(source), source]),
	)
	const deleted = previous.sources.filter(
		(source) => !currentKeys.has(key(source)),
	)
	const changed = discovered.filter((source) => {
		const prior = previousByKey.get(key(source))
		return (
			!prior ||
			(!previousTransformsQualified &&
				prior.transformKey !==
					sha256(
						stableJson({
							sourceSha256: source.sha256,
							profile: source.profile,
							compatibility,
						}),
					))
		)
	})
	const prior = new Map(previous.sources.map((source) => [key(source), source]))
	const labels = (sources: Array<{ path: string; profile: string }>) =>
		sources.map(({ path, profile }) => `${path} [${profile}]`).sort()
	const added = labels(changed.filter((source) => !prior.has(key(source))))
	const changedExisting = labels(
		changed.filter((source) => prior.has(key(source))),
	)
	return {
		added,
		changed: changedExisting,
		deleted: labels(deleted),
		expectedTransforms: changed.length,
		pipelineWideInvalidation:
			discovered.length > 0 &&
			changedExisting.length === discovered.length &&
			added.length === 0 &&
			deleted.length === 0,
	}
}

function printPlan(plan: Awaited<ReturnType<typeof generationPlan>>): void {
	console.log(JSON.stringify(plan, null, 2))
	if (plan.deleted.length > 0)
		console.log(
			"Deletion acknowledgement required: review every deleted source/profile, then rerun stage with --allow-deleted.",
		)
}

async function gitTimestamp(): Promise<string> {
	const { stdout } = await promisify(execFile)(
		"git",
		["show", "-s", "--format=%ct", "HEAD"],
		{ cwd: root },
	)
	return new Date(Number(stdout.trim()) * 1000).toISOString()
}

export async function run(args: CliArguments): Promise<void> {
	const provider = await configProvider(args.config)
	const staleAllowed = [
		"discover",
		"doctor",
		"generate",
		"hydrate-generation",
		"plan",
		"prepare",
		"stage",
	].includes(args.command)
	const config = await loadConfig(provider, staleAllowed)

	if (args.command === "discover") {
		const { discoverArtifactSources } = await import("./discover")
		const sources = await discoverArtifactSources(root, config)
		console.log(
			JSON.stringify({
				profiles: sources.length,
				sources: new Set(sources.map(({ path }) => path)).size,
			}),
		)
		return
	}
	if (args.command === "doctor") {
		const { diagnose } = await import("./doctor")
		const result = await diagnose(root, config)
		console.log(
			args.json ? JSON.stringify(result) : JSON.stringify(result, null, 2),
		)
		return
	}
	if (args.command === "restore" || args.command === "verify") {
		const { restore } = await import("./archive")
		console.log(
			JSON.stringify(
				await restore(root, config, artifactStoreFromEnvironment(config)),
			),
		)
		return
	}
	if (args.command === "hydrate-generation" || args.command === "prepare") {
		const { prepareGeneration } = await import("./archive")
		console.log(
			JSON.stringify(
				await prepareGeneration(
					root,
					config,
					artifactStoreFromEnvironment(config),
					outputPath(args.output),
				),
			),
		)
		return
	}
	if (args.command === "plan") {
		printPlan(
			await generationPlan(
				config,
				resolve(args.previous ?? `${defaultOutput}/manifest.v1.json`),
			),
		)
		return
	}
	if (args.command === "stage") {
		assertTrustedGenerationPlatform()
		const output = outputPath(args.output)
		const { prepareGeneration } = await import("./archive")
		await prepareGeneration(
			root,
			config,
			artifactStoreFromEnvironment(config),
			output,
		)
		const previous = resolve(output, "manifest.v1.json")
		const plan = await generationPlan(config, previous)
		printPlan(plan)
		if (plan.deleted.length > 0 && !args.allowDeleted)
			throw new Error(
				"Stage stopped before encoding: deletion was not acknowledged",
			)
		const { generate } = await import("./generate")
		const manifest = await generate({
			root,
			config,
			output,
			previousManifest: previous,
			allowDeleted: args.allowDeleted,
			createdAt: await gitTimestamp(),
		})
		await provider.afterGenerate?.(root)
		console.log(JSON.stringify({ publicationId: manifest.publicationId }))
		return
	}
	if (args.command === "generate") {
		assertTrustedGenerationPlatform()
		const { generate } = await import("./generate")
		const manifest = await generate({
			root,
			config,
			output: outputPath(args.output),
			previousManifest: args.previous,
			allowDeleted: args.allowDeleted,
			createdAt: process.env.SOURCE_DATE_EPOCH
				? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
				: undefined,
		})
		await provider.afterGenerate?.(root)
		console.log(JSON.stringify({ publicationId: manifest.publicationId }))
		return
	}
	assertTrustedGenerationPlatform()
	const store = artifactStoreFromEnvironment(config)
	if (!store)
		throw new Error(
			"Publishing requires B2_BUCKET_ID, B2_APPLICATION_KEY_ID, and B2_APPLICATION_KEY (or HISTORICAL_IMAGES_STORE_DIR for a local mock)",
		)
	if (store instanceof B2ArtifactStore) await store.checkPermissions(true)
	const { publish } = await import("./archive")
	const output = outputPath(args.output)
	console.log(
		JSON.stringify(
			await publish(
				root,
				config,
				store,
				resolve(output, "manifest.v1.json"),
				resolve(output, "assets"),
				(summary) =>
					console.log(
						JSON.stringify({
							publicationPlan: {
								sourceProfiles: summary.sourceProfiles,
								uniqueObjects: summary.uniqueObjects,
								uniqueBytes: summary.uniqueBytes,
								addedSourceProfiles: summary.addedSourceProfiles.length,
								changedSourceProfiles: summary.changedSourceProfiles.length,
								removedSourceProfiles: summary.removedSourceProfiles.length,
								addedPublicPaths: summary.addedPublicPaths.length,
								removedPublicPaths: summary.removedPublicPaths.length,
							},
						}),
					),
			),
		),
	)
}
