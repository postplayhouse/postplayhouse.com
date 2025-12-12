import { mdsvex } from "mdsvex"
import mdsvexConfig from "./mdsvex.config.js"
import adapter from "@sveltejs/adapter-netlify"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

import "./env.js" // Side effect: ensure PUBLIC_BUILD_URL is known to svelte-check

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: [".svelte", ...(mdsvexConfig.extensions || [])],

	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex(mdsvexConfig)],

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({ split: true }),
		prerender: { handleHttpError: "fail", handleMissingId: "warn" },
		alias: {
			$components: "src/components",
			$data: "src/data",
			$helpers: "src/helpers",
			$models: "src/models",
		},
	},
}

export default config
