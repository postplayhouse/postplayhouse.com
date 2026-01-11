import type { PlaywrightTestConfig } from "@playwright/test"
import { config as dotenvConfig } from "dotenv"

// Load .env file for tests
dotenvConfig()

// Set env var so server knows it's running in test mode
process.env.PLAYWRIGHT_TEST = "true"

const config: PlaywrightTestConfig = {
	webServer: {
		command: "pnpm run dev --port 4173",
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
		env: {
			...process.env,
			PLAYWRIGHT_TEST: "true",
		},
	},
	testDir: "tests",
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
}

export default config
