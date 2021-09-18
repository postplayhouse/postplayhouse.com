import path from "path"
import { fileURLToPath } from "url"

import { preprocess as compilerPreprocess } from "svelte/compiler"

import replace from "@rollup/plugin-replace"
import staticSite from "@sveltejs/adapter-static"
import { mdsvex } from "mdsvex"
import preprocess from "svelte-preprocess"
import svelteImage from "svelte-image"

// import.meta works. The conditions described to make it work are actually in
// place... ?
// @ts-expect-error see above
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const imagePreprocessor = svelteImage({
  optimizeAll: true, // optimize all images discovered in img tags
  inlineBelow: 10000, // inline all images in img tags below 10kb
  compressionLevel: 5, // png quality level
  quality: 50, // jpeg/webp quality level
  optimizeRemote: false,
  processFolders: [
    // These are all problem folders, where the images are not referenced in a
    // way that svelteImage understands, but still need to be present in the
    // build. Referencing them here forces the entire folder to be processed,
    // even if the reference to a given image is eventually removed. Probably
    // not a big deal, since there will be few, if any cases where that happens.
    "images/people",
    "images/perennials",
    "images/2014",
    "images/2015",
    "images/2016",
    "images/2017",
    "images/2018",
    "images/2019",
    "images/2020",
  ],
  processFoldersRecursively: true,
  processFoldersSizes: true,
})

// There is some kind of race condition between the preprocessor and the adapter
// such that any images created in the `static/g/` folder aren't present on the
// first run of `npm run build`. Since this project only relies upon the
// recursive folder image processing done by svelte-image, we can just feed it
// one fake template when this file is loaded. By the time the actual adapter is
// run, the images will already be in place.
//
// This is a hack, to be sure. Perhaps when SvelteKit hits 1.0, this won't be a
// problem anymore? To reproduce the actual issue, comment out the next line
// (since it is the workaround) and run `npm run clean && npm run build`. If you
// don't get any 404 errors from prerender, then the bug is gone.
imagePreprocessor.markup({ content: "<html/>" })

function runImagesAfterOthers(otherProcessors) {
  return {
    markup: async ({ content, filename }) => {
      const otherProcessorsReturn = await compilerPreprocess(
        content,
        otherProcessors,
        { filename },
      )
      content = otherProcessorsReturn.code

      const { code } = await imagePreprocessor.markup({ content })
      return {
        ...otherProcessorsReturn,
        code,
      }
    },
  }
}

/** @xActualType {Array<[string | RegExp, string] | [RegExp, (substring: string, ...args: any[]) => string]>} */
/** @type {Array<[string, string]>} */
const replacements = [
  ["process.env.NODE_ENV", JSON.stringify(process.env.NODE_ENV)],
  [
    "process.env.DEPLOY_PRIME_URL",
    JSON.stringify(process.env.DEPLOY_PRIME_URL),
  ],
  ["process.env.CONTEXT", JSON.stringify(process.env.CONTEXT)],
]

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  extensions: [".svelte", ".md"],
  preprocess: runImagesAfterOthers([
    mdsvex({
      smartypants: true,
      extensions: [".md"],
      layout: path.join(__dirname, "./src/components/DefaultMdLayout.svelte"),
    }),
    preprocess({
      postcss: true,
      replace: replacements,
    }),
  ]),

  kit: {
    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",
    adapter: staticSite(),
    prerender: { onError: "continue" },
    vite: {
      plugins: [
        replace({
          values: replacements.reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value }),
            {},
          ),
          preventAssignment: true,
        }),
      ],
      resolve: {
        alias: {
          $components: path.resolve("./src/components"),
        },
      },
    },
  },
}

export default config
// Workaround until SvelteKit uses Vite 2.3.8 (and it's confirmed to fix the Tailwind JIT problem)
const mode = process.env.NODE_ENV
const dev = mode === "development"
process.env.TAILWIND_MODE = dev ? "watch" : "build"
