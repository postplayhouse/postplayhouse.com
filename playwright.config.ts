import type { PlaywrightTestConfig } from "@playwright/test"
import { config as dotenvConfig } from "dotenv"

// Load .env file for tests
dotenvConfig()

const config: PlaywrightTestConfig = {
	webServer: {
		command: "pnpm run dev --port 4173",
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
	testDir: "tests",
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
}

export default config
