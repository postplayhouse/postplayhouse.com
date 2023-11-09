import path from "path"
import { fileURLToPath } from "url"

import { preprocess as compilerPreprocess } from "svelte/compiler"

import adapter from "@sveltejs/adapter-netlify"
import { mdsvex } from "mdsvex"
import preprocess from "svelte-preprocess"
import svelteImage from "svelte-image"

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
    "images/2022",
    "images/2023",
    "images/2024",
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
export const replacements = [
  ["process.env.NODE_ENV", JSON.stringify(process.env.NODE_ENV)],
  [
    "process.env.DEPLOY_PRIME_URL",
    JSON.stringify(process.env.DEPLOY_PRIME_URL),
  ],
  ["process.env.CONTEXT", JSON.stringify(process.env.CONTEXT)],
  ["BUILD_TIME", JSON.stringify(new Date().toUTCString())],
]

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".md"],
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
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
    adapter: adapter({ split: true }),
    prerender: { handleHttpError: "warn", handleMissingId: "warn" },
  },
}

export default config
