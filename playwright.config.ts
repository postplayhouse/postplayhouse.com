import type { PlaywrightTestConfig } from "@playwright/test"

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
