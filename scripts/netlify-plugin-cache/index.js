import { cpSync, existsSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const localCache = resolve(repository, ".cache/historical-images")
const netlifyCache = "/opt/build/cache/postplayhouse/historical-images"

function merge(source, destination) {
	if (!existsSync(source)) return
	mkdirSync(destination, { recursive: true })
	cpSync(source, destination, { recursive: true, force: true })
}

export const onPreBuild = async () => {
	merge(netlifyCache, localCache)
}

export const onPostBuild = async () => {
	merge(localCache, netlifyCache)
}
