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
import copyProgramBioImages from "./src/routes/(app)/program-bios/copyProgramBioImagesVitePlugin"

// Ensure the build URL is available
import { buildUrl } from "./env.js"

const uploadsSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN)

export default defineConfig(() => ({
	plugins: [
		downloadMediaImages,
		copyProgramBioImages,
		tailwindcss(),
		enhancedImages(),
		...(uploadsSourceMaps
			? [
					sentrySvelteKit({
						sourceMapsUploadOptions: {
							org: "post-playhouse",
							project: "javascript-sveltekit",
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
		netlify({
			middleware: process.env.PLAYWRIGHT_TEST !== "true",
			edgeFunctions: { enabled: process.env.PLAYWRIGHT_TEST !== "true" },
		}),
	],
	test: {
		include: [
			"src/**/*.{test,spec}.{js,ts}",
			"scripts/**/*.{test,spec}.{js,ts}",
		],
		environment: "jsdom",
		setupFiles: ["./vitest-setup.js"],
	},
	build: {
		sourcemap: true,
	},
}))
