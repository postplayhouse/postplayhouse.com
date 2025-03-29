// Modified from
// https://chatgpt.com/c/67e70e13-df24-8009-a928-4df6d07b7c6f

import { execSync } from "child_process"
import { fileURLToPath } from "url"
import path from "path"
import { existsSync } from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const B2_BUCKET = "postplayhouse"
const B2_CACHE_BASE = `${B2_BUCKET}/cache`
const NETLIFY_CACHE_BASE = "/opt/build/cache/hc_my_cache"

const NODE_CACHE_PATH = "node_modules/.cache"
const IMAGE_TOOLS_CACHE_PATH = `${NODE_CACHE_PATH}/imagetools`

const LOCAL_IMAGE_TOOLS_CACHE = `${NETLIFY_CACHE_BASE}/${IMAGE_TOOLS_CACHE_PATH}`
const B2_IMAGE_TOOLS_CACHE = `b2://${B2_CACHE_BASE}/${IMAGE_TOOLS_CACHE_PATH}`

// Path to the downloaded b2 binary
const B2_CLI_PATH = "/opt/build/cache/b2"

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

export const onPreBuild = async () => {
	ensureEnvVars()

	try {
		console.log("Restoring node cache from netlify cache...")
		runCommand(
			`../copy_folder.cjs --merge ${NETLIFY_CACHE_BASE}/${NODE_CACHE_PATH} --to ../../${NODE_CACHE_PATH}`,
		)

		return
	} catch (err) {
		console.error(
			"Netlify cache not found. Attempting to restore from Backblaze B2...",
			err,
		)
	}

	try {
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

	console.log("Saving entire node cache locally")
	runCommand(
		`../copy_folder.cjs --save ../../${NODE_CACHE_PATH} --to ${NETLIFY_CACHE_BASE}/${NODE_CACHE_PATH}`,
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
