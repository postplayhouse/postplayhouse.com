import { execSync } from "child_process"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const NODE_CACHE_PATH = "node_modules/.cache"
const LOCAL_NODE_CACHE = path.resolve(__dirname, "../../", NODE_CACHE_PATH)
const NETLIFY_NODE_CACHE = path.resolve(
	"/opt/build/cache/hc_my_cache",
	NODE_CACHE_PATH,
)
/**
 * @param {string} command
 */
function runCommand(command) {
	console.log(`Running: ${command}`)

	execSync(command, {
		stdio: "inherit",
		cwd: __dirname,
	})
}

export const onPreBuild = async () => {
	try {
		console.log("Restoring local node cache from netlify node cache...")
		runCommand(
			`../copy_folder.cjs --merge ${NETLIFY_NODE_CACHE} --to ${LOCAL_NODE_CACHE}`,
		)
	} catch (err) {
		console.error(
			"Netlify node cache not found. Continuing with the shared read-only cache restore...",
			err,
		)
	}

	// This command always degrades to a cold build. It never publishes.
	runCommand("pnpm cache:images:restore")
}

export const onPostBuild = async () => {
	console.log("Post-build process started.")

	console.log("Saving entire local node cache to netlify")
	runCommand(
		`../copy_folder.cjs --save ${LOCAL_NODE_CACHE} --to ${NETLIFY_NODE_CACHE}`,
	)
}
