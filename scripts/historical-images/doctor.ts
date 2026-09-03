import { lstat, readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import type { ArtifactConfig } from "./config"
import { hashFile } from "./hash"
import { lockSchema } from "./schema"

interface Inventory {
	files: number
	bytes: number
	verification: "unverified"
}

async function inventory(path: string): Promise<Inventory> {
	let files = 0
	let bytes = 0
	try {
		for (const relative of await readdir(path, { recursive: true })) {
			const details = await lstat(join(path, relative))
			if (details.isFile()) {
				files += 1
				bytes += details.size
			}
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
	}
	return { files, bytes, verification: "unverified" }
}

function credentials(prefix: string): {
	configured: boolean
	incomplete: boolean
	presenceOnly: true
} {
	const present = ["BUCKET_ID", "APPLICATION_KEY_ID", "APPLICATION_KEY"].map(
		(name) => Boolean(process.env[`${prefix}_${name}`]),
	)
	return {
		configured: present.every(Boolean),
		incomplete: present.some(Boolean) && !present.every(Boolean),
		presenceOnly: true,
	}
}

export async function diagnose(
	root: string,
	config: ArtifactConfig,
): Promise<Record<string, unknown>> {
	let lockStatus: Record<string, unknown>
	let generatedOutputs: Record<string, string> = {}
	try {
		const lock = lockSchema.parse(
			JSON.parse(await readFile(join(root, config.lockPath), "utf8")),
		)
		lockStatus = {
			status: "schema-verified",
			schemaVersion: lock.schemaVersion,
			publicationId: lock.publicationId,
			manifest: "not-checked-offline",
		}
		for (const path of config.generatedOutputPaths) {
			const expected = lock.generatedOutputs?.[path]
			try {
				const actual = await lstat(join(root, path))
				generatedOutputs[path] =
					expected &&
					actual.isFile() &&
					actual.size === expected.bytes &&
					(await hashFile(join(root, path))) === expected.sha256
						? "verified"
						: "mismatch"
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
				generatedOutputs[path] = "missing"
			}
		}
	} catch (error) {
		lockStatus = {
			status: "invalid",
			reason: error instanceof Error ? error.message : String(error),
		}
	}
	const generatedHealthy = Object.values(generatedOutputs).every(
		(status) => status === "verified",
	)
	const cache = await inventory(join(root, config.cacheRoot))
	const readCredentials = credentials("HISTORICAL_IMAGES_READ_B2")
	return {
		lock: lockStatus,
		generationPlatform: {
			supported: process.platform === "linux" && process.arch === "x64",
			platform: process.platform,
			arch: process.arch,
		},
		generatedOutputs,
		cache,
		staticAssets: await inventory(join(root, config.staticAssetRoot)),
		credentials: {
			read: readCredentials,
			publisher: credentials("HISTORICAL_IMAGES_PUBLISH_B2"),
			bio: credentials("B2"),
		},
		network: "not-contacted",
		nextCommand:
			lockStatus.status === "invalid" || !generatedHealthy
				? config.trustedPublishCommand
				: cache.files === 0 && !readCredentials.configured
					? "Seed a verified cache or configure the dedicated read-only credential, then run pnpm images:historical:restore"
					: "pnpm images:historical:restore",
	}
}
