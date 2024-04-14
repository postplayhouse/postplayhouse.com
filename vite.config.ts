import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vitest/config"
import { replace } from "./replacements.config"
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
		sveltekit(),
	],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
})
