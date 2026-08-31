import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { publish, restore } from "./archive"
import { B2ArtifactStore } from "./b2"
import { discoverHistoricalSources } from "./discover"
import { generate } from "./generate"
import { FileArtifactStore, type ArtifactStore } from "./store"

const root = process.cwd()

function argument(name: string): string | undefined {
	const index = process.argv.indexOf(name)
	return index < 0 ? undefined : process.argv[index + 1]
}

function b2Store(): ArtifactStore | null {
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
	return new B2ArtifactStore({ keyId, applicationKey, bucketId })
}

async function main(): Promise<void> {
	const command = process.argv[2]
	if (command === "discover") {
		const sources = await discoverHistoricalSources(root)
		console.log(
			JSON.stringify({
				profiles: sources.length,
				sources: new Set(sources.map(({ path }) => path)).size,
			}),
		)
		return
	}
	if (command === "generate") {
		const output = resolve(
			argument("--output") ?? ".historical-images-output.ignore",
		)
		const manifest = await generate({
			root,
			output,
			previousManifest: argument("--previous"),
			allowDeleted: process.argv.includes("--allow-deleted"),
			createdAt: process.env.SOURCE_DATE_EPOCH
				? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
				: undefined,
		})
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
		const store = b2Store()
		if (!store)
			throw new Error(
				"Publishing requires B2_BUCKET_ID, B2_APPLICATION_KEY_ID, and B2_APPLICATION_KEY (or HISTORICAL_IMAGES_STORE_DIR for a local mock)",
			)
		if (store instanceof B2ArtifactStore) await store.checkPermissions(true)
		const output = resolve(
			argument("--output") ?? ".historical-images-output.ignore",
		)
		console.log(
			JSON.stringify(
				await publish(
					root,
					store,
					resolve(output, "manifest.v1.json"),
					resolve(output, "assets"),
				),
			),
		)
		return
	}
	if (command === "restore" || command === "verify") {
		const store = b2Store()
		if (store instanceof B2ArtifactStore) await store.checkPermissions(false)
		const result = await restore(root, store)
		console.log(JSON.stringify(result))
		return
	}
	throw new Error(
		"Usage: historical-images <discover|generate|publish|restore|verify>",
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
