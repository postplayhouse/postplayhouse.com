import type { PlaywrightTestConfig } from "@playwright/test"
import { config as dotenvConfig } from "dotenv"

// Load .env file for tests
dotenvConfig()

const config: PlaywrightTestConfig = {
	webServer: {
		command:
			"pnpm build:low-memory && exec pnpm run dev",
		port: 3000,
		// Build first for artifact assertions, then use Vite dev for Netlify Blobs emulation.
		timeout: 1_500_000,
	},
	testDir: "tests",
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
}

export default config
