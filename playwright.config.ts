import type { PlaywrightTestConfig } from "@playwright/test"
import { config as dotenvConfig } from "dotenv"

// Load .env file for tests
dotenvConfig()

process.env.PLAYWRIGHT_TEST = "true"
process.env.INDIVIDUAL_PASSPHRASES_LIST ||= "playwright-member,playwright-admin"
process.env.ADMIN_PASSPHRASE_POSITIONS ||= "2"

const config: PlaywrightTestConfig = {
	webServer: {
		command: "pnpm build:low-memory && exec pnpm run dev",
		port: 3000,
		reuseExistingServer: !process.env.CI,
		// Build first for artifact assertions, then use Vite dev for Netlify Blobs emulation.
		timeout: 1_500_000,
		env: {
			...process.env,
			PLAYWRIGHT_TEST: "true",
		},
	},
	testDir: "tests",
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
}

export default config
