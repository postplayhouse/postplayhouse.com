import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vitest/config"
import { replace } from "./replacements.config"
import { watchAndRun } from "vite-plugin-watch-and-run"

import { sentrySvelteKit } from "@sentry/sveltekit"

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: "post-playhouse",
				project: "javascript-sveltekit",
			},
		}),
		replace(),
		watchAndRun([
			{
				watch: "**/src/data/**/*.yml",
				run: "touch ./src/data/_yaml.ts",
			},
			{
				watch: "**/src/routes/\\(app\\)/jobs/**/*.md",
				run: "touch ./src/routes/\\(app\\)/jobs/_posts-metadata.ts",
			},
		]),

		sveltekit(),
	],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
})
