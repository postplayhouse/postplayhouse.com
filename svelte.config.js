import preprocess from "svelte-preprocess"
import staticSite from "@sveltejs/adapter-static"
import { mdsvex } from "mdsvex"
import path from "path"

import { dirname } from "path"
import { fileURLToPath } from "url"

// import.meta works. The conditions described to make it work are actually in
// place... ?
// @ts-expect-error see above
const __dirname = dirname(fileURLToPath(import.meta.url))

const _svelteImageConfig = {
  optimizeAll: true, // optimize all images discovered in img tags
  inlineBelow: 10000, // inline all images in img tags below 10kb
  compressionLevel: 5, // png quality level
  quality: 50, // jpeg/webp quality level
  tagName: "Image", // default component name
  sizes: [400, 800, 1200], // array of sizes for srcset in pixels
  breakpoints: [375, 768, 1024], // array of screen size breakpoints at which sizes above will be applied
  outputDir: "g/",
  placeholder: "trace", // or "blur",
  webpOptions: {
    // WebP options [sharp docs](https://sharp.pixelplumbing.com/en/stable/api-output/#webp)
    quality: 75,
    lossless: false,
    force: true,
  },
  webp: true,
  trace: {
    // Potrace options for SVG placeholder
    background: "#fff",
    color: "#002fa7",
    threshold: 120,
  },
  processFolders: ["images/people"],
  processFoldersRecursively: true,
  processFoldersSizes: true,
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  extensions: [".svelte", ".md"],
  preprocess: [
    mdsvex({
      smartypants: true,
      extensions: [".md"],
      layout: path.join(__dirname, "./src/components/DefaultMdLayout.svelte"),
    }),
    preprocess({
      postcss: true,
    }),
  ],

  kit: {
    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",
    adapter: staticSite(),
  },
}

export default config
// Workaround until SvelteKit uses Vite 2.3.8 (and it's confirmed to fix the Tailwind JIT problem)
const mode = process.env.NODE_ENV
const dev = mode === "development"
process.env.TAILWIND_MODE = dev ? "watch" : "build"
