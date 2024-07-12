import path from "path"
import { fileURLToPath } from "url"
import rehypeSlug from "rehype-slug"

import { defineMDSveXConfig as defineConfig } from "mdsvex"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config = defineConfig({
	extensions: [".svelte.md", ".md", ".svx"],

	smartypants: true,
	layout: path.join(__dirname, "./src/components/DefaultMdLayout.svelte"),

	remarkPlugins: [],
	rehypePlugins: [rehypeSlug],
})

export default config
