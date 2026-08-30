import type { PlaywrightTestConfig } from "@playwright/test"

const config: PlaywrightTestConfig = {
	webServer: {
		command:
			"pnpm build:low-memory && exec node node_modules/vite/bin/vite.js preview --port 3000",
		port: 3000,
		// An uncached serial image build takes about 19 minutes.
		timeout: 1_500_000,
	},
	testDir: "tests",
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
}

export default config
