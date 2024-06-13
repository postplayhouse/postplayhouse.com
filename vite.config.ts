import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vitest/config"
import replacePlugin from "@rollup/plugin-replace"
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

		replacePlugin({
			values: {
				"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),

				"process.env.DEPLOY_PRIME_URL": JSON.stringify(
					process.env.DEPLOY_PRIME_URL,
				),

				"process.env.CONTEXT": JSON.stringify(process.env.CONTEXT),
			},
			preventAssignment: true,
		}),

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
	build: {
		sourcemap: true,
	},
})
