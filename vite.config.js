import path from "path"
import { sveltekit } from "@sveltejs/kit/vite"
import { watchAndRun } from "vite-plugin-watch-and-run"

import replace from "@rollup/plugin-replace"
import { replacements } from "./svelte.config"

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		replace({
			values: replacements.reduce(
				(acc, [key, value]) => ({ ...acc, [key]: value }),
				{},
			),
			preventAssignment: true,
		}),
		watchAndRun([
			{
				watch: "**/src/data/**/*.yml",
				run: "touch ./src/data/_yaml.ts && echo didit",
			},
			{
				watch: "**/src/routes/\\(app\\)/jobs/**/*.md",
				run: "touch ./src/routes/\\(app\\)/jobs/_posts-metadata.ts && echo didit",
			},
		]),
		sveltekit(),
	],
	resolve: {
		alias: {
			$components: path.resolve("./src/components"),
			$data: path.resolve("./src/data"),
			$helpers: path.resolve("./src/helpers"),
			$models: path.resolve("./src/models"),
		},
	},
}

export default config
