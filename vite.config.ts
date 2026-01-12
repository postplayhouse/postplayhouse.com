/// <reference types="vitest/config" />
import { defineConfig } from "vite"
import { sveltekit } from "@sveltejs/kit/vite"
import replacePlugin from "@rollup/plugin-replace"
import { watchAndRun } from "vite-plugin-watch-and-run"
import { sentrySvelteKit } from "@sentry/sveltekit"
import { enhancedImages } from "@sveltejs/enhanced-img"
import { svelteTesting } from "@testing-library/svelte/vite"
import tailwindcss from "@tailwindcss/vite"
import netlify from "@netlify/vite-plugin"
import downloadMediaImages from "./src/routes/(app)/media/downloadMediaImagesVitePlugin"

// Ensure the build URL is available
import { buildUrl } from "./env.js"

// Only enable Sentry in production builds
const isProduction = process.env.NODE_ENV === "production"

export default defineConfig(() => ({
	plugins: [
		downloadMediaImages,
		tailwindcss(),
		enhancedImages(),
		// Sentry plugin disabled in dev/test - not needed locally and reduces startup time
		...(isProduction
			? [
					sentrySvelteKit({
						sourceMapsUploadOptions: {
							org: "post-playhouse",
							project: "javascript-sveltekit",
							// Future version of Don: This actually works on Netlify, just not
							// locally. So it is fine when you see the "No auth token provided"
							// error. I am guessing that the ENV variables from the .env file are
							// not loaded for vite config, but are loaded for the app and the rest
							// of the build. On Sentry, the ENV vars are always available, so it
							// works there. Plus, we don't really want it to work here anyway.
						},
					}),
				]
			: []),

		replacePlugin({
			values: {
				// This one is not escaped because it is already used as a string where
				// it is invoked. (The content of the Jobs listings are MD files, so
				// everything inside them is one big string. We are not replacing code,
				// we are replacing content.) So in cases where we need to replace an
				// actual string in our code, we just need to wrap it up like an actual
				// string. See an example in the `data/site.ts` file.
				__PUBLIC_BUILD_URL__: buildUrl,
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
		svelteTesting(),
		// Disable middleware and edge functions during tests - middleware causes
		// "Response body object should not be disturbed or locked" errors with multipart form data
		netlify({
			middleware: process.env.PLAYWRIGHT_TEST !== "true",
			edgeFunctions: process.env.PLAYWRIGHT_TEST !== "true",
		}),
	],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
		environment: "jsdom",
		setupFiles: ["./vitest-setup.js"],
	},
	build: {
		sourcemap: true,
	},
}))
