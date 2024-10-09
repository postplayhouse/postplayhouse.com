import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vitest/config"
import replacePlugin from "@rollup/plugin-replace"
import { watchAndRun } from "vite-plugin-watch-and-run"
import { sentrySvelteKit } from "@sentry/sveltekit"
import { enhancedImages } from "@sveltejs/enhanced-img"

const prod = process.env.NODE_ENV === "production"
const live = process.env.CONTEXT === "production"
const liveUrl = "https://postplayhouse.com"
const buildUrl = live
	? liveUrl
	: prod
		? process.env.DEPLOY_PRIME_URL || liveUrl
		: "http://localhost:3000"

export default defineConfig({
	plugins: [
		enhancedImages(),
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: "post-playhouse",
				project: "javascript-sveltekit",
			},
		}),

		replacePlugin({
			values: {
				"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),

				// This one is not escaped because it is already used as a string where
				// it is invoked. (The content of the Jobs listings are MD files, so
				// everything inside them is one big string. We are not replacing code,
				// we are replacing content.) So in cases where we need to replace an
				// actual string in our code, we just need to wrap it up like an actual
				// string. See an example in the `data/site.ts` file.
				__URL__: buildUrl,
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
