import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vitest/config"
import { replace } from "./replacements.config"

export default defineConfig({
	plugins: [replace(), sveltekit()],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
})
