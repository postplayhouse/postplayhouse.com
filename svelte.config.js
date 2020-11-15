const path = require("path")
const { mdsvex } = require("mdsvex")
const sveltePreprocess = require("svelte-preprocess")

const mode = process.env.NODE_ENV
const dev = mode === "development"

/**
 * This array of objects needs to be turned into an array of preprocessors
 * before running. The reason for extracting them like so is to shield the
 * language server from code it cannot run.
 */
const preprocessors = [
  {
    name: "mdsvex",
    makeProcessor: mdsvex,
    config: {
      smartypants: true,
      extensions: [".md"],
      layout: path.join(__dirname, "./src/components/DefaultMdLayout.svelte"),
    },
  },

  /**
   * The processor for svelte image causes a problem for the language server
   * integration. The actual function that creates its preprocessor is housed in
   * the svelte.config.runtime.js file, but will use the config object below to
   * populate it.
   */
  {
    name: "svelteImage",
    makeProcessor: () => {
      throw new Error("No processor for svelteImage")
    },
    config: {
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
    },
  },
  // Leaving this type error, but it is correct as is. If the error goes away,
  // so can this comment.
  { name: "sveltePreprocess", makeProcessor: sveltePreprocess, config: {} },
]

const finalizePreprocessor = (x) => x.makeProcessor(x.config)

const extensions = [".svelte", ".md"]

const languageServerConfig = {
  dev,
  hydratable: true,
  emitCss: true,
  preprocess: preprocessors
    .filter((x) => x.name !== "svelteImage")
    .map(finalizePreprocessor),
  extensions,
}

module.exports = {
  ...languageServerConfig,

  // The following params shouldn't affect consumers of this config. If that
  // changes, a refactor will be in order.
  /**
   * The `finalizePreprocessors` function that you supply will be given access
   * to the preprocessors array. Return an array with the same-shaped objects.
   */
  ___createPostPlayhouseRuntimeConfig({ preprocessorPlug = (x) => x }) {
    return {
      ...languageServerConfig,
      preprocess: preprocessors.map(preprocessorPlug).map(finalizePreprocessor),
    }
  },
}
