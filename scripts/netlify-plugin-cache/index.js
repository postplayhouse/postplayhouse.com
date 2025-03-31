// Modified from https://chatgpt.com/c/67e70e13-df24-8009-a928-4df6d07b7c6f
//
// In order to truly clear the cache and build from scratch, you will have to
// clean the B2 folder for imagetools. Don't remove the folder, because we don't
// ensure it exists on B2. (We ensure it exists locally.)
//
// You could optionally clear your development cache on your computer, rebuild
// there, then upload that result to B2, which means you won't have to have a 10
// minute build on Netlify. But if you don't care, just clear the b@ cache, and
// clear Netlify's cache, and do a full rebuild on Netlify.

import { execSync } from "child_process"
import { fileURLToPath } from "url"
import path from "path"
import { existsSync } from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const NODE_CACHE_PATH = "node_modules/.cache"
const IMAGE_TOOLS_CACHE_PATH = `${NODE_CACHE_PATH}/imagetools`

const B2_IMAGE_TOOLS_CACHE = `b2://postplayhouse/cache/${IMAGE_TOOLS_CACHE_PATH}`

const LOCAL_NODE_CACHE = path.resolve(__dirname, "../../", NODE_CACHE_PATH)
const NETLIFY_NODE_CACHE = path.resolve(
	"/opt/build/cache/hc_my_cache",
	NODE_CACHE_PATH,
)
const LOCAL_IMAGE_TOOLS_CACHE = path.resolve(
	__dirname,
	"../../",
	IMAGE_TOOLS_CACHE_PATH,
)

// Path to the downloaded b2 binary
const B2_CLI_PATH = "/opt/build/cache/b2"

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

function installB2IfNeeded() {
	console.log("Checking if Backblaze B2 CLI is installed...")
	if (!existsSync(B2_CLI_PATH)) {
		console.log("Backblaze B2 CLI not found. Installing...")
		runCommand(
			`curl -L https://github.com/Backblaze/B2_Command_Line_Tool/releases/latest/download/b2-linux -o ${B2_CLI_PATH}`,
		)
		runCommand(`chmod +x ${B2_CLI_PATH}`)
	} else {
		console.log("Backblaze B2 CLI is already installed.")
	}
}

function ensureEnvVars() {
	if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
		console.error("Error: Backblaze B2 credentials are not set.")
		process.exit(1)
	}
}

function ensureLocalImagetoolsDir() {
	if (!existsSync(LOCAL_IMAGE_TOOLS_CACHE)) {
		console.log("Creating local imagetools cache directory...")
		runCommand(`mkdir -p ${LOCAL_IMAGE_TOOLS_CACHE}`)
	} else {
		console.log("Imagetools cache directory already exists.")
	}
}

export const onPreBuild = async () => {
	ensureEnvVars()

	try {
		console.log("Restoring local node cache from netlify node cache...")
		runCommand(
			`../copy_folder.cjs --merge ${NETLIFY_NODE_CACHE} --to ${LOCAL_NODE_CACHE}`,
		)

		return
	} catch (err) {
		console.error(
			"Netlify cache not found. Attempting to restore from Backblaze B2...",
			err,
		)
	}

	try {
		ensureLocalImagetoolsDir()
		installB2IfNeeded()

		console.log("Restoring cache from Backblaze B2...")
		runCommand(
			`${B2_CLI_PATH} sync --compare-versions none ${B2_IMAGE_TOOLS_CACHE} ${LOCAL_IMAGE_TOOLS_CACHE}`,
		)
	} catch {
		console.error(
			"Failed to restore cache from Backblaze B2. Proceeding without cache.",
		)
	}
}

export const onPostBuild = async () => {
	console.log("Post-build process started.")

	console.log("Saving entire local node cache to netlify")
	runCommand(
		`../copy_folder.cjs --save ${LOCAL_NODE_CACHE} --to ${NETLIFY_NODE_CACHE}`,
	)

	try {
		console.log("Storing imagetools cache in Backblaze B2...")
		runCommand(
			`${B2_CLI_PATH} sync --compare-versions none ${LOCAL_IMAGE_TOOLS_CACHE} ${B2_IMAGE_TOOLS_CACHE}`,
		)
	} catch {
		console.error(
			"Failed to store imagetools cache in Backblaze B2. Proceeding without storing cache.",
		)
	}
}
